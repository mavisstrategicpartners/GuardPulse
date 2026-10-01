package com.guardpulse.backend.customer;

import jakarta.persistence.*;

import java.time.Instant;

/**
 * A login session. Only the SHA-256 hash of the token is stored, so a database leak does not
 * hand out usable sessions. Deleting a customer deletes their tokens, which logs them out
 * immediately.
 */
@Entity
@Table(name = "auth_tokens")
public class AuthToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 64)
    private String tokenHash;

    @ManyToOne(optional = false)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    private Instant createdAt = Instant.now();

    @Column(nullable = false)
    private Instant expiresAt;

    protected AuthToken() {
    }

    public AuthToken(String tokenHash, Customer customer, Instant expiresAt) {
        this.tokenHash = tokenHash;
        this.customer = customer;
        this.expiresAt = expiresAt;
    }

    public Customer getCustomer() { return customer; }
    public Instant getExpiresAt() { return expiresAt; }
}