package com.guardpulse.backend.shipping;

import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Component
public class CourierGuyClient {
    private static final Logger log = LoggerFactory.getLogger(CourierGuyClient.class);

    private final RestClient http;
    private final String apiKey;
    private final Set<String> excludedCodes;
    private final Map<String, Object> collection;
    private final double boxL, boxW, boxH;

    public CourierGuyClient(
            @Value("${courier.api-key:}") String apiKey,
            @Value("${courier.base-url:https://api.portal.thecourierguy.co.za}") String baseUrl,
            @Value("${courier.auth-scheme:Bearer}") String authScheme,
            @Value("${courier.exclude-codes:SDX,LSF,LSP}") String exclude,
            @Value("${courier.collect.company:GuardPulse}") String cCompany,
            @Value("${courier.collect.street:}") String cStreet,
            @Value("${courier.collect.area:}") String cArea,
            @Value("${courier.collect.city:}") String cCity,
            @Value("${courier.collect.zone:}") String cZone,
            @Value("${courier.collect.code:}") String cCode,
            @Value("${courier.box.length-cm:30}") double l,
            @Value("${courier.box.width-cm:20}") double w,
            @Value("${courier.box.height-cm:15}") double h) {
        this.apiKey = apiKey;
        this.excludedCodes = new HashSet<>(Arrays.asList(exclude.split(",")));
        this.boxL = l; this.boxW = w; this.boxH = h;
        this.collection = address("business", cCompany, cStreet, cArea, cCity, cZone, cCode);

        var f = new SimpleClientHttpRequestFactory();
        f.setConnectTimeout(4000);
        f.setReadTimeout(8000);
        this.http = RestClient.builder().requestFactory(f).baseUrl(baseUrl)
                .defaultHeader("Authorization", (authScheme + " " + apiKey).trim())
                .build();
    }

    public boolean isConfigured() {
        return !apiKey.isBlank() && collection.get("code") != null && !collection.get("code").toString().isBlank();
    }

    /** Cheapest allowed service, whole Rand, VAT included. Empty on any failure. */
    public Optional<BigDecimal> quote(String street, String city, String province,
                                      String postalCode, BigDecimal weightKg) {
        if (!isConfigured()) return Optional.empty();
        try {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("collection_address", collection);
            body.put("delivery_address", address("residential", "", street, city, city, province, postalCode));
            body.put("parcels", List.of(Map.of(
                    "submitted_length_cm", boxL, "submitted_width_cm", boxW,
                    "submitted_height_cm", boxH, "submitted_weight_kg", weightKg)));

            JsonNode res = http.post().uri("/rates").body(body).retrieve().body(JsonNode.class);
            BigDecimal best = null;
            for (JsonNode r : res.path("rates")) {
                String code = r.path("service_level").path("code").asText();
                if (excludedCodes.contains(code)) continue;
                BigDecimal rate = r.path("rate").decimalValue();
                if (best == null || rate.compareTo(best) < 0) best = rate;
            }
            return Optional.ofNullable(best).map(b -> b.setScale(0, RoundingMode.CEILING));
        } catch (Exception e) {
            log.warn("Courier Guy rate lookup failed, using weight tiers: {}", e.getMessage());
            return Optional.empty();
        }
    }

    private static Map<String, Object> address(String type, String company, String street,
                                               String area, String city, String zone, String code) {
        Map<String, Object> a = new LinkedHashMap<>();
        a.put("type", type); a.put("company", company); a.put("street_address", street);
        a.put("local_area", area); a.put("city", city); a.put("zone", zone);
        a.put("country", "ZA"); a.put("code", code);
        return a;
    }
}