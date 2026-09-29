package com.guardpulse.backend.orders.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class CheckoutRequest {
    @NotBlank
    public String cartToken;
 
    @NotBlank
    public String fullName;
 
    @Email @NotBlank
    public String email;
 
    @NotBlank
    public String phone;
 
    @NotBlank
    public String addressLine1;
 
    public String addressLine2;
 
    @NotBlank
    public String city;
 
    @NotBlank
    public String province;
 
    @NotBlank
    public String postalCode;
 
    // shippingFee intentionally removed — see OrderController.checkout(), which computes
    // it server-side from the cart's actual weight via ShippingService. Trusting a
    // client-submitted fee would let anyone check out with free shipping just by sending 0.
}
 
