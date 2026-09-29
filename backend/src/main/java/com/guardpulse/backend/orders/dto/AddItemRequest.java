package com.guardpulse.backend.orders.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public class AddItemRequest {
    @NotBlank
    public String productSlug;

    @Min(1)
    public int quantity = 1;
}


