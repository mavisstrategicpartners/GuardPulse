package com.guardpulse.backend.customer;

import java.time.Instant;

public record CustomerDto(Long id, String email, String fullName, String phone, Instant createdAt) {
    public static CustomerDto from(Customer c) {
        return new CustomerDto(c.getId(), c.getEmail(), c.getFullName(), c.getPhone(), c.getCreatedAt());
    }
}