package com.guardpulse.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class StoreInfoController {

    @Value("${store.vat-number:}")
    private String vatNumber;

    @Value("${store.vat-rate-percent:15}")
    private int vatRatePercent;

    @Value("${store.prices-include-vat:true}")
    private boolean pricesIncludeVat;

    public record StoreInfoDto(String vatNumber, int vatRatePercent, boolean pricesIncludeVat) {}

    @GetMapping("/api/store-info")
    public StoreInfoDto storeInfo() {
        return new StoreInfoDto(vatNumber.isBlank() ? null : vatNumber, vatRatePercent, pricesIncludeVat);
    }
}


