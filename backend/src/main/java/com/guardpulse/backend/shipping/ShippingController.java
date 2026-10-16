package com.guardpulse.backend.shipping;

import com.guardpulse.backend.orders.Cart;
import com.guardpulse.backend.orders.CartRepository;
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
    private final ShippingQuoter shippingQuoter;
    private final CartRepository cartRepository;

    public ShippingController(ShippingService shippingService,
                              ShippingQuoter shippingQuoter,
                              CartRepository cartRepository) {
        this.shippingService = shippingService;
        this.shippingQuoter = shippingQuoter;
        this.cartRepository = cartRepository;
    }

    public record ShippingQuoteDto(BigDecimal fee, BigDecimal weightKg) {}

    /**
     * Live estimate shown on the checkout page. Without an address it returns the weight-tier
     * estimate; once street/city/province/postal_code are supplied it asks The Courier Guy for a
     * real rate. The order's actual shipping_fee is always recomputed server-side at checkout
     * from the same logic — this endpoint is a preview, never trusted as the final charge.
     */
    @GetMapping("/api/shipping/quote")
    public ShippingQuoteDto quote(
            @RequestParam("cart_token") String cartToken,
            @RequestParam(value = "street", required = false) String street,
            @RequestParam(value = "city", required = false) String city,
            @RequestParam(value = "province", required = false) String province,
            @RequestParam(value = "postal_code", required = false) String postalCode) {
        Cart cart;
        try {
            cart = cartRepository.findByToken(UUID.fromString(cartToken))
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cart not found"));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid cart token");
        }
        BigDecimal weight = shippingService.totalWeightKg(cart.getItems());
        BigDecimal fee = shippingQuoter.quote(cart.getItems(), street, city, province, postalCode);
        return new ShippingQuoteDto(fee, weight);
    }
}