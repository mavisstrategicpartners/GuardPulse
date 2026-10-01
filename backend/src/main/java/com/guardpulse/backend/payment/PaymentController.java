package com.guardpulse.backend.payment;

import com.guardpulse.backend.mail.OrderNotifier;
import com.guardpulse.backend.orders.Order;
import com.guardpulse.backend.orders.OrderRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

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

    /** Frontend calls this to get the fields it needs to redirect the customer to PayFast. Safe to call again to retry payment. */
    @GetMapping("/{reference}/")
    public PayFastInitDto init(@PathVariable String reference) {
        Order order = findOrder(reference);
        if (order.getStatus() != Order.Status.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This order isn't awaiting payment.");
        }
        return new PayFastInitDto(payFastProperties.getProcessUrl(), payFastService.buildPaymentFields(order));
    }

    /**
     * PayFast calls this server-to-server once payment completes — only this webhook (never the
     * customer's browser redirect) marks an order paid. Anything other than a plain 200 makes
     * PayFast retry, so "not for us / nothing to do" cases answer 200 and real failures answer 400.
     */
    @PostMapping("/itn")
    public ResponseEntity<String> handleItn(HttpServletRequest request) throws IOException {
        String rawBody = readRawBody(request);
        Map<String, String> fields = parseFormBodyPreservingOrder(rawBody);

        if (!payFastService.verifyItnSignature(fields)) {
            log.warn("PayFast ITN signature mismatch, ignoring. Fields received: {}", fields.keySet());
            return ResponseEntity.badRequest().body("invalid signature");
        }

        String merchantId = fields.get("merchant_id");
        if (merchantId != null && !merchantId.isBlank() && !merchantId.equals(payFastProperties.getMerchantId())) {
            log.warn("PayFast ITN for a different merchant id ({}), ignoring", merchantId);
            return ResponseEntity.badRequest().body("wrong merchant");
        }

        if (!payFastService.confirmWithPayFast(payFastService.itnParamString(fields))) {
            log.warn("PayFast server-side ITN confirmation failed for {}", fields.get("m_payment_id"));
            return ResponseEntity.badRequest().body("could not confirm with payfast");
        }

        String reference = fields.get("m_payment_id");
        Order order = null;
        try {
            if (reference != null) {
                order = orderRepository.findByReference(UUID.fromString(reference)).orElse(null);
            }
        } catch (IllegalArgumentException notAUuid) {
            // fall through to "unknown order"
        }
        if (order == null) {
            log.warn("PayFast ITN for unknown order reference {}", reference);
            return ResponseEntity.ok("order not found, ignored");
        }

        String grossText = fields.getOrDefault("amount_gross", fields.get("amount"));
        BigDecimal notifiedAmount;
        try {
            notifiedAmount = new BigDecimal(grossText.trim());
        } catch (RuntimeException badAmount) {
            log.warn("PayFast ITN for order {} had an unreadable amount: {}", reference, grossText);
            return ResponseEntity.badRequest().body("bad amount");
        }
        if (notifiedAmount.compareTo(order.getTotal()) != 0) {
            log.warn("PayFast ITN amount mismatch for order {}: expected {}, got {}",
                    reference, order.getTotal(), notifiedAmount);
            return ResponseEntity.badRequest().body("amount mismatch");
        }

        String paymentStatus = fields.get("payment_status");
        if ("COMPLETE".equalsIgnoreCase(paymentStatus)) {
            if (order.getStatus() == Order.Status.PENDING) {
                order.setStatus(Order.Status.PAID);
                orderRepository.save(order);
                orderNotifier.notifyPaymentConfirmed(order);
                log.info("Order {} marked PAID via PayFast ITN (pf_payment_id {})", reference, fields.get("pf_payment_id"));
            } else {
                log.info("PayFast ITN COMPLETE for order {} already in status {}, nothing to do", reference, order.getStatus());
            }
        } else {
            log.info("PayFast ITN for order {} has payment_status {}, order left as {}",
                    reference, paymentStatus, order.getStatus());
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

    /** Preserves field order (PayFast's signature depends on it) and keeps blank fields. */
    static Map<String, String> parseFormBodyPreservingOrder(String rawBody) {
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