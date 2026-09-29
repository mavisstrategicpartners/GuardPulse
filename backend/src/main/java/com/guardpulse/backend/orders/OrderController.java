package com.guardpulse.backend.orders;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import com.guardpulse.backend.mail.OrderNotifier;
import com.guardpulse.backend.orders.dto.CheckoutRequest;
import com.guardpulse.backend.orders.dto.OrderDto;
import com.guardpulse.backend.shipping.ShippingService;

 
import java.math.BigDecimal;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
 
    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final OrderNotifier orderNotifier;
    private final ShippingService shippingService;
 
    public OrderController(OrderRepository orderRepository, CartRepository cartRepository,
                            OrderNotifier orderNotifier, ShippingService shippingService) {
        this.orderRepository = orderRepository;
        this.cartRepository = cartRepository;
        this.orderNotifier = orderNotifier;
        this.shippingService = shippingService;
    }
 
    @PostMapping({"", "/"})
    @Transactional
    public ResponseEntity<OrderDto> checkout(@Valid @RequestBody CheckoutRequest request) {
        Cart cart;
        try {
            cart = cartRepository.findByToken(UUID.fromString(request.cartToken))
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cart not found or already checked out"));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid cart token");
        }
        if (cart.getItems().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cart is empty");
        }
 
        // Shipping is always computed here from the cart's actual weight — never taken from
        // the request. A client-supplied shipping_fee would let anyone check out for free
        // delivery just by sending 0.
        BigDecimal shippingFee = shippingService.computeFee(cart.getItems());
 
        Order order = new Order(
                request.fullName, request.email, request.phone,
                request.addressLine1, request.addressLine2,
                request.city, request.province, request.postalCode,
                shippingFee
        );
 
        try {
            for (CartItem cartItem : cart.getItems()) {
                // Decrement stock now, at the point of purchase — not earlier at add-to-cart time,
                // since a cart is just an intent until checkout actually happens.
                cartItem.getProduct().decreaseStock(cartItem.getQuantity());
                order.addItem(new OrderItem(order, cartItem.getProduct(), cartItem.getQuantity()));
            }
        } catch (IllegalStateException outOfStock) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, outOfStock.getMessage());
        }
        order.recalculateTotal();
 
        try {
            orderRepository.saveAndFlush(order);
        } catch (ObjectOptimisticLockingFailureException race) {
            // Someone else's checkout decremented the same product's stock between our read and write.
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Stock changed while placing your order — please review your cart and try again.");
        }
 
        cart.getItems().clear();
        cartRepository.save(cart);
 
        orderNotifier.notifyOrderPlaced(order);
 
        return ResponseEntity.status(HttpStatus.CREATED).body(OrderDto.from(order));
    }
 
    @GetMapping("/{reference}/")
    public OrderDto lookup(@PathVariable String reference) {
        try {
            Order order = orderRepository.findByReference(UUID.fromString(reference))
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
            return OrderDto.from(order);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found");
        }
    }
 
    /**
     * Lets a guest-checkout customer find an order again if they've lost their confirmation
     * email/link. Requires both the reference AND the email on the order to match — a bare
     * reference isn't enough, since UUIDs can end up in browser history, shared screenshots, etc.
     */
    @GetMapping("/lookup")
    public OrderDto lookupByEmail(@RequestParam String reference, @RequestParam String email) {
        Order order;
        try {
            order = orderRepository.findByReference(UUID.fromString(reference))
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No order found for those details"));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No order found for those details");
        }
        if (!order.getEmail().equalsIgnoreCase(email.trim())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No order found for those details");
        }
        return OrderDto.from(order);
    }
}
 
