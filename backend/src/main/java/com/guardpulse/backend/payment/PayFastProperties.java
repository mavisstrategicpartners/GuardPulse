package com.guardpulse.backend.payment;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class PayFastProperties {

    @Value("${payfast.merchant-id}")
    private String merchantId;

    @Value("${payfast.merchant-key}")
    private String merchantKey;

    /** Optional extra security PayFast setting from your merchant dashboard. Leave blank if you haven't set one. */
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

    /** Sandbox ITNs come from PayFast's sandbox validation host, not the production one. */
    public String getValidateHost() {
        return sandbox ? "sandbox.payfast.co.za" : "www.payfast.co.za";
    }
}


