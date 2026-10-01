package com.guardpulse.backend.payment;

import com.guardpulse.backend.orders.Order;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.RoundingMode;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Builds the signed field set for the PayFast payment redirect, and verifies the
 * Instant Transaction Notification (ITN) PayFast sends back.
 *
 * IMPORTANT — the two signatures are built differently (per PayFast's documentation):
 *  - OUTGOING payment form: blank fields are left out, values are trimmed.
 *  - INCOMING ITN: EVERY posted field is included in the order received, including the many
 *    that arrive blank (custom_str1..5, custom_int1..5, item_description ...). Skipping the
 *    blanks here makes every genuine ITN fail verification, so orders never become PAID.
 */
@Service
public class PayFastService {

    private static final Logger log = LoggerFactory.getLogger(PayFastService.class);

    private final PayFastProperties props;
    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

    public PayFastService(PayFastProperties props) {
        this.props = props;
    }

    // ------------------------------------------------------------ outgoing payment

    /** Builds the full field set (including signature) to redirect the customer to PayFast with. */
    public Map<String, String> buildPaymentFields(Order order) {
        // LinkedHashMap: PayFast's signature depends on field order, which must match the documented order.
        Map<String, String> fields = new LinkedHashMap<>();
        put(fields, "merchant_id", props.getMerchantId());
        put(fields, "merchant_key", props.getMerchantKey());
        put(fields, "return_url", props.getReturnUrl() + "/" + order.getReference());
        put(fields, "cancel_url", props.getCancelUrl() + "/" + order.getReference());
        put(fields, "notify_url", props.getNotifyUrl());

        String[] names = order.getFullName().trim().split("\\s+", 2);
        put(fields, "name_first", truncate(names[0], 100));
        if (names.length > 1) {
            put(fields, "name_last", truncate(names[1], 100)); // skipped automatically if blank
        }
        put(fields, "email_address", order.getEmail());

        put(fields, "m_payment_id", order.getReference().toString());
        put(fields, "amount", order.getTotal().setScale(2, RoundingMode.HALF_UP).toPlainString());
        put(fields, "item_name", "GuardPulse order " + order.getReference());

        fields.put("signature", signOutgoing(fields));
        return fields;
    }

    /** Adds a field only if it has a value, trimmed — so what we sign is exactly what the browser posts. */
    private static void put(Map<String, String> fields, String key, String value) {
        if (value == null) return;
        String trimmed = value.trim();
        if (!trimmed.isEmpty()) fields.put(key, trimmed);
    }

    /** Signature for the outgoing payment form (must NOT already contain a "signature" key). */
    public String signOutgoing(Map<String, String> fields) {
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, String> entry : fields.entrySet()) {
            if (entry.getKey().equals("signature")) continue;
            String value = entry.getValue() == null ? "" : entry.getValue().trim();
            if (value.isEmpty()) continue;
            if (!sb.isEmpty()) sb.append('&');
            sb.append(entry.getKey()).append('=').append(urlEncode(value));
        }
        return md5Hex(withPassphrase(sb.toString()));
    }

    // ------------------------------------------------------------ incoming ITN

    /**
     * The parameter string PayFast signs for an ITN: every posted field except "signature",
     * in the order received, blanks included, values url-encoded.
     */
    public String itnParamString(Map<String, String> postedFieldsInOrder) {
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, String> entry : postedFieldsInOrder.entrySet()) {
            if (entry.getKey().equals("signature")) continue;
            if (!sb.isEmpty()) sb.append('&');
            sb.append(entry.getKey()).append('=').append(urlEncode(entry.getValue() == null ? "" : entry.getValue()));
        }
        return sb.toString();
    }

    /** Verifies an incoming ITN's signature. The map must preserve the order the fields arrived in. */
    public boolean verifyItnSignature(Map<String, String> postedFieldsInOrder) {
        String given = postedFieldsInOrder.get("signature");
        if (given == null) return false;
        String expected = md5Hex(withPassphrase(itnParamString(postedFieldsInOrder)));
        return expected.equalsIgnoreCase(given.trim());
    }

    /**
     * PayFast's second check: post the parameter string back to PayFast and confirm they answer
     * "VALID". Network failures are treated as "not valid" (fail closed) — PayFast retries ITNs.
     */
    public boolean confirmWithPayFast(String paramString) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://" + props.getValidateHost() + "/eng/query/validate"))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(paramString))
                    .timeout(Duration.ofSeconds(10))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            boolean valid = "VALID".equalsIgnoreCase(response.body().trim());
            if (!valid) {
                log.warn("PayFast validate endpoint answered '{}' (HTTP {})", response.body().trim(), response.statusCode());
            }
            return valid;
        } catch (Exception e) {
            log.error("PayFast server-side ITN validation call failed", e);
            return false;
        }
    }

    // ------------------------------------------------------------ helpers

    private String withPassphrase(String paramString) {
        String passphrase = props.getPassphrase();
        if (passphrase != null && !passphrase.isBlank()) {
            return paramString + "&passphrase=" + urlEncode(passphrase.trim());
        }
        return paramString;
    }

    private static String truncate(String value, int max) {
        return value.length() <= max ? value : value.substring(0, max);
    }

    /** Matches PHP's urlencode(), which PayFast's signature is defined against: spaces as '+', '*' as %2A. */
    static String urlEncode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8).replace("*", "%2A");
    }

    private static String md5Hex(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : digest) hex.append(String.format("%02x", b));
            return hex.toString();
        } catch (Exception e) {
            throw new IllegalStateException("MD5 not available", e);
        }
    }
}