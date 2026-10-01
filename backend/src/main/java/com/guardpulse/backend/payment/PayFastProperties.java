package com.guardpulse.backend.payment;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class PayFastProperties {

    private static final Logger log = LoggerFactory.getLogger(PayFastProperties.class);

    @Value("${payfast.merchant-id}")
    private String merchantId;

    @Value("${payfast.merchant-key}")
    private String merchantKey;

    /**
     * Must match the "Salt passphrase" in your PayFast dashboard EXACTLY. If one is set there
     * and you leave this blank (or vice versa) every payment fails with "signature mismatch".
     */
    @Value("${payfast.passphrase:}")
    private String passphrase;

    /** true -> https://sandbox.payfast.co.za, false -> https://www.payfast.co.za (real money) */
    @Value("${payfast.sandbox:true}")
    private boolean sandbox;

    @Value("${payfast.return-url}")
    private String returnUrl;

    @Value("${payfast.cancel-url}")
    private String cancelUrl;

    @Value("${payfast.notify-url}")
    private String notifyUrl;

    /** Prints how PayFast is configured at startup, so a bad deployment setting is obvious in the logs. */
    @PostConstruct
    void logConfiguration() {
        log.info("PayFast: mode={}, merchant_id={}, passphrase {}",
                sandbox ? "SANDBOX (no real money)" : "LIVE", merchantId,
                passphrase == null || passphrase.isBlank() ? "NOT set" : "set");
        log.info("PayFast URLs: return={}, cancel={}, notify={}", returnUrl, cancelUrl, notifyUrl);
        if (!sandbox) {
            if (isLocal(returnUrl) || isLocal(cancelUrl) || isLocal(notifyUrl)) {
                log.error("PayFast is LIVE but a return/cancel/notify URL points at localhost. Customers will be sent "
                        + "to the wrong place and PayFast can never tell your server a payment succeeded. Set "
                        + "PAYFAST_RETURN_URL, PAYFAST_CANCEL_URL and PAYFAST_NOTIFY_URL.");
            }
            if (!notifyUrl.startsWith("https://")) {
                log.warn("PayFast notify URL is not https: {}", notifyUrl);
            }
            if ("10000100".equals(merchantId)) {
                log.error("PayFast is LIVE but still using the sandbox test merchant id 10000100.");
            }
        } else if (isLocal(notifyUrl)) {
            log.warn("PayFast notify URL is localhost: PayFast's sandbox cannot reach it, so orders will stay PENDING "
                    + "unless you expose this server with a tunnel (e.g. ngrok) and set PAYFAST_NOTIFY_URL.");
        }
    }

    private static boolean isLocal(String url) {
        return url == null || url.contains("localhost") || url.contains("127.0.0.1");
    }

    public String getMerchantId() { return merchantId; }
    public String getMerchantKey() { return merchantKey; }
    public String getPassphrase() { return passphrase; }
    public boolean isSandbox() { return sandbox; }
    public String getReturnUrl() { return returnUrl; }
    public String getCancelUrl() { return cancelUrl; }
    public String getNotifyUrl() { return notifyUrl; }

    public String getProcessUrl() {
        return sandbox ? "https://sandbox.payfast.co.za/eng/process" : "https://www.payfast.co.za/eng/process";
    }

    /** Sandbox ITNs are validated against PayFast's sandbox host, not the production one. */
    public String getValidateHost() {
        return sandbox ? "sandbox.payfast.co.za" : "www.payfast.co.za";
    }
}