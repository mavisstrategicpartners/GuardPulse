package com.guardpulse.backend.payment;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import com.guardpulse.backend.mail.OrderNotifier;
import com.guardpulse.backend.orders.Order;
import com.guardpulse.backend.orders.OrderRepository;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/payments/payfast")
public class PaymentController {

    private static final Logger log = LoggerFactory.getLogger(PaymentController.class);

    private final PayFastService payFastService;
    private final PayFastProperties payFastProperties;
    private final OrderRepository orderRepository;
    private final OrderNotifier orderNotifier;

    public PaymentController(PayFastService payFastService, PayFastProperties payFastProperties,
                              OrderRepository orderRepository, OrderNotifier orderNotifier) {
        this.payFastService = payFastService;
        this.payFastProperties = payFastProperties;
        this.orderRepository = orderRepository;
        this.orderNotifier = orderNotifier;
    }

    public record PayFastInitDto(String processUrl, Map<String, String> fields) {}

    /** Frontend calls this right after checkout to get the fields it needs to redirect the customer to PayFast. */
    @GetMapping("/{reference}/")
    public PayFastInitDto init(@PathVariable String reference) {
        Order order = findOrder(reference);
        if (order.getStatus() != Order.Status.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This order isn't awaiting payment.");
        }
        return new PayFastInitDto(payFastProperties.getProcessUrl(), payFastService.buildPaymentFields(order));
    }

    /**
     * PayFast calls this server-to-server once payment completes — never trust the customer's
     * browser redirect alone for marking an order paid, only this webhook.
     */
    @PostMapping("/itn")
    public ResponseEntity<String> handleItn(HttpServletRequest request) throws IOException {
        String rawBody = readRawBody(request);
        Map<String, String> fields = parseFormBodyPreservingOrder(rawBody);

        if (!payFastService.verifyItnSignature(fields)) {
            log.warn("PayFast ITN signature mismatch, ignoring. Fields: {}", fields.keySet());
            return ResponseEntity.badRequest().body("invalid signature");
        }
        if (!payFastService.confirmWithPayFast(rawBody)) {
            log.warn("PayFast server-side ITN confirmation failed, ignoring notification for {}",
                    fields.get("m_payment_id"));
            return ResponseEntity.badRequest().body("could not confirm with payfast");
        }

        String paymentStatus = fields.get("payment_status");
        String reference = fields.get("m_payment_id");
        Order order = orderRepository.findByReference(UUID.fromString(reference)).orElse(null);
        if (order == null) {
            log.warn("PayFast ITN for unknown order reference {}", reference);
            return ResponseEntity.ok("order not found, ignored");
        }

        BigDecimal notifiedAmount = new BigDecimal(fields.getOrDefault("amount_gross", fields.get("amount")));
        if (notifiedAmount.compareTo(order.getTotal()) != 0) {
            log.warn("PayFast ITN amount mismatch for order {}: expected {}, got {}",
                    reference, order.getTotal(), notifiedAmount);
            return ResponseEntity.badRequest().body("amount mismatch");
        }

        if ("COMPLETE".equalsIgnoreCase(paymentStatus) && order.getStatus() == Order.Status.PENDING) {
            order.setStatus(Order.Status.PAID);
            orderRepository.save(order);
            orderNotifier.notifyPaymentConfirmed(order);
            log.info("Order {} marked PAID via PayFast ITN", reference);
        }

        return ResponseEntity.ok("ok");
    }

    private Order findOrder(String reference) {
        try {
            return orderRepository.findByReference(UUID.fromString(reference))
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found");
        }
    }

    private static String readRawBody(HttpServletRequest request) throws IOException {
        try (InputStream is = request.getInputStream()) {
            return new String(is.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    /** Preserves field order, which PayFast's signature scheme depends on. */
    private static Map<String, String> parseFormBodyPreservingOrder(String rawBody) {
        Map<String, String> result = new LinkedHashMap<>();
        for (String pair : rawBody.split("&")) {
            if (pair.isEmpty()) continue;
            int idx = pair.indexOf('=');
            String key = idx >= 0 ? pair.substring(0, idx) : pair;
            String value = idx >= 0 ? pair.substring(idx + 1) : "";
            result.put(URLDecoder.decode(key, StandardCharsets.UTF_8), URLDecoder.decode(value, StandardCharsets.UTF_8));
        }
        return result;
    }
}


