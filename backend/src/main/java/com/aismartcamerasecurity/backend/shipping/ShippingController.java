package com.aismartcamerasecurity.backend.shipping;


import com.aismartcamerasecurity.backend.orders.Cart;
import com.aismartcamerasecurity.backend.orders.CartRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.UUID;

@RestController
public class ShippingController {

    private final ShippingService shippingService;
    private final CartRepository cartRepository;

    public ShippingController(ShippingService shippingService, CartRepository cartRepository) {
        this.shippingService = shippingService;
        this.cartRepository = cartRepository;
    }

    public record ShippingQuoteDto(BigDecimal fee, BigDecimal weightKg) {}

    /**
     * Live estimate shown on the checkout page. The order's actual shipping_fee is always
     * recomputed server-side at checkout time from this same logic — this endpoint exists
     * purely so the customer sees the real number before they submit, not to be trusted as
     * the final charge itself.
     */
    @GetMapping("/api/shipping/quote")
    public ShippingQuoteDto quote(@RequestParam("cart_token") String cartToken) {
        Cart cart;
        try {
            cart = cartRepository.findByToken(UUID.fromString(cartToken))
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cart not found"));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid cart token");
        }
        BigDecimal weight = shippingService.totalWeightKg(cart.getItems());
        BigDecimal fee = shippingService.computeFeeForWeight(weight);
        return new ShippingQuoteDto(fee, weight);
    }
}

