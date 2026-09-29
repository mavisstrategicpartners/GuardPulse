package com.guardpulse.backend.shipping;


import com.guardpulse.backend.orders.CartItem;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
public class ShippingService {

    private final ShippingRates rates;

    public ShippingService(ShippingRates rates) {
        this.rates = rates;
    }

    public BigDecimal totalWeightKg(List<CartItem> items) {
        return items.stream()
                .map(item -> item.getProduct().getWeightKg().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /** Weight-tiered fee, rounded to whole Rand. See ShippingRates for the caveat on where these numbers come from. */
    public BigDecimal computeFee(List<CartItem> items) {
        return computeFeeForWeight(totalWeightKg(items));
    }

    public BigDecimal computeFeeForWeight(BigDecimal weightKg) {
        BigDecimal fee;
        if (weightKg.compareTo(rates.tier1MaxKg) <= 0) {
            fee = rates.tier1Fee;
        } else if (weightKg.compareTo(rates.tier2MaxKg) <= 0) {
            fee = rates.tier2Fee;
        } else if (weightKg.compareTo(rates.tier3MaxKg) <= 0) {
            fee = rates.tier3Fee;
        } else if (weightKg.compareTo(rates.tier4MaxKg) <= 0) {
            fee = rates.tier4Fee;
        } else {
            BigDecimal excessKg = weightKg.subtract(rates.tier4MaxKg);
            fee = rates.tier4Fee.add(excessKg.multiply(rates.overTier4RatePerKg));
        }
        return fee.setScale(0, RoundingMode.HALF_UP);
    }
}
