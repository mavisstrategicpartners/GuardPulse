package com.guardpulse.backend.payment;

import com.guardpulse.backend.orders.Order;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
 
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
 * Builds the field set PayFast expects for a payment redirect, and validates the signature
 * on incoming ITN (Instant Transaction Notification) webhooks.
 *
 * Reference: https://developers.payfast.co.za/docs — the signature algorithm and the
 * "post back to PayFast to confirm" validation step are both exactly as documented there.
 * PayFast's API has changed field names/requirements before; if this integration starts
 * rejecting payments, that documentation page is the first thing to re-check.
 */
@Service
public class PayFastService {
 
    private static final Logger log = LoggerFactory.getLogger(PayFastService.class);
 
    private final PayFastProperties props;
    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
 
    public PayFastService(PayFastProperties props) {
        this.props = props;
    }
 
    /** Builds the full field set (including signature) to redirect the customer to PayFast with. */
    public Map<String, String> buildPaymentFields(Order order) {
        // LinkedHashMap: PayFast's signature is order-sensitive, so field insertion order matters.
        Map<String, String> fields = new LinkedHashMap<>();
        fields.put("merchant_id", props.getMerchantId());
        fields.put("merchant_key", props.getMerchantKey());
        fields.put("return_url", props.getReturnUrl() + "/" + order.getReference());
        fields.put("cancel_url", props.getCancelUrl() + "/" + order.getReference());
        fields.put("notify_url", props.getNotifyUrl());
 
        String[] names = order.getFullName().trim().split("\\s+", 2);
        fields.put("name_first", names[0]);
        // Only include name_last when there actually is one — sending it as an empty string
        // caused an intermittent signature mismatch for single-word names, because PayFast's
        // own signature check doesn't necessarily skip blank fields the same way ours does.
        // Omitting the field entirely removes the ambiguity rather than relying on both sides
        // agreeing on how to treat blanks.
        if (names.length > 1 && !names[1].isBlank()) {
            fields.put("name_last", names[1]);
        }
        fields.put("email_address", order.getEmail());
 
        fields.put("m_payment_id", order.getReference().toString());
        fields.put("amount", order.getTotal().setScale(2, java.math.RoundingMode.HALF_UP).toString());
        fields.put("item_name", "GuardPulse order " + order.getReference());
 
        fields.put("signature", sign(fields));
        return fields;
    }
 
    /** Computes the PayFast signature for a field set (must NOT already contain a "signature" key). */
    public String sign(Map<String, String> fields) {
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, String> entry : fields.entrySet()) {
            if (entry.getKey().equals("signature")) continue;
            String value = entry.getValue() == null ? "" : entry.getValue().trim();
            if (value.isEmpty()) continue; // PayFast: omit empty fields from the signature string
            if (!sb.isEmpty()) sb.append('&');
            sb.append(entry.getKey()).append('=').append(urlEncode(value));
        }
        if (props.getPassphrase() != null && !props.getPassphrase().isBlank()) {
            sb.append("&passphrase=").append(urlEncode(props.getPassphrase().trim()));
        }
       
        return md5Hex(sb.toString());
    }
 
    /**
     * Verifies an incoming ITN's signature. `postedFieldsInOrder` must preserve the exact order
     * the fields arrived in the raw POST body — see PaymentController for how that's parsed.
     */
    public boolean verifyItnSignature(Map<String, String> postedFieldsInOrder) {
        String given = postedFieldsInOrder.get("signature");
        if (given == null) return false;
        Map<String, String> withoutSignature = new LinkedHashMap<>(postedFieldsInOrder);
        withoutSignature.remove("signature");
        String expected = sign(withoutSignature);
        return expected.equalsIgnoreCase(given);
    }
 
    /**
     * PayFast's recommended second check: post the raw ITN body back to their own server and
     * confirm they echo "VALID". Protects against spoofed notifications even if the signature
     * check above were somehow bypassed. Network failures are treated as "not valid" — fail closed.
     */
    public boolean confirmWithPayFast(String rawBody) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://" + props.getValidateHost() + "/eng/query/validate"))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(rawBody))
                    .timeout(Duration.ofSeconds(10))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            return "VALID".equalsIgnoreCase(response.body().trim());
        } catch (Exception e) {
            log.error("PayFast server-side ITN validation call failed", e);
            return false;
        }
    }
 
    private static String urlEncode(String value) {
        // PayFast expects spaces as '+', which URLEncoder already does by default.
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
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
