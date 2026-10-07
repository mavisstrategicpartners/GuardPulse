package com.guardpulse.backend.customer;

import jakarta.persistence.*;

import java.time.Instant;

/** A registered shopper. Orders placed while logged in are linked to this account. */
@Entity
@Table(name = "customers")
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Always stored lower-case. */
    @Column(unique = true, nullable = false)
    private String email;

    /** BCrypt hash — the plain password is never stored. */
    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private String fullName;

    private String phone;

    private Instant createdAt = Instant.now();

    protected Customer() {
    }

    public Customer(String email, String passwordHash, String fullName, String phone) {
        this.email = email;
        this.passwordHash = passwordHash;
        this.fullName = fullName;
        this.phone = phone;
    }

    public Long getId() { return id; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    /** Used by AuthService.resetPassword() when a customer resets a forgotten password. */
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public Instant getCreatedAt() { return createdAt; }
}