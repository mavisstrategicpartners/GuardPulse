package com.guardpulse.backend.shipping;

import com.guardpulse.backend.orders.CartItem;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.List;

@Service
public class ShippingQuoter {
    private final ShippingService tiers;
    private final CourierGuyClient courier;

    public ShippingQuoter(ShippingService tiers, CourierGuyClient courier) {
        this.tiers = tiers; this.courier = courier;
    }

    public BigDecimal quote(List<CartItem> items, String street, String city,
                            String province, String postalCode) {
        BigDecimal weight = tiers.totalWeightKg(items);
        boolean haveAddress = postalCode != null && postalCode.trim().length() == 4
                && city != null && !city.isBlank();
        if (haveAddress) {
            var live = courier.quote(street == null ? "" : street, city, province == null ? "" : province,
                                     postalCode.trim(), weight);
            if (live.isPresent()) return live.get();
        }
        return tiers.computeFee(items);
    }
}
