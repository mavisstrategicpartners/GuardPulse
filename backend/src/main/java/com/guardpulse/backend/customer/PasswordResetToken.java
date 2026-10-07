package com.guardpulse.backend.customer;

import jakarta.persistence.*;

import java.time.Instant;

/**
 * A one-time "forgot password" link. Only the SHA-256 hash of the token is stored (same
 * pattern as AuthToken) so a database leak doesn't hand out usable reset links. Deleted the
 * moment it's used, or replaced if the customer requests another one before using the first.
 */
@Entity
@Table(name = "password_reset_tokens")
public class PasswordResetToken {

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

    protected PasswordResetToken() {
    }

    public PasswordResetToken(String tokenHash, Customer customer, Instant expiresAt) {
        this.tokenHash = tokenHash;
        this.customer = customer;
        this.expiresAt = expiresAt;
    }

    public Customer getCustomer() { return customer; }
    public Instant getExpiresAt() { return expiresAt; }
}
