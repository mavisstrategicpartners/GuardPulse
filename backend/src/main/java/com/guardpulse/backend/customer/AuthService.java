package com.guardpulse.backend.customer;

import com.guardpulse.backend.orders.Order;
import com.guardpulse.backend.orders.OrderRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

/**
 * Customer registration, login and session handling.
 *
 * Sessions are random opaque bearer tokens stored (hashed) in the database rather than JWTs,
 * so that when an admin deletes an account the customer is logged out on their very next
 * request — a signed JWT cannot be revoked like that.
 */
@Service
public class AuthService {

    private static final Duration TOKEN_TTL = Duration.ofDays(30);
    private static final int MAX_PASSWORD_BYTES = 72; // BCrypt ignores anything beyond this

    private final CustomerRepository customers;
    private final AuthTokenRepository tokens;
    private final OrderRepository orders;
    private final PasswordEncoder encoder;
    private final SecureRandom random = new SecureRandom();
    private final String dummyHash;

    public AuthService(CustomerRepository customers, AuthTokenRepository tokens,
                       OrderRepository orders, PasswordEncoder encoder) {
        this.customers = customers;
        this.tokens = tokens;
        this.orders = orders;
        this.encoder = encoder;
        // Compared against when an email isn't registered, so "no such user" and "wrong
        // password" take the same time and can't be told apart by timing.
        this.dummyHash = encoder.encode("not-a-real-password");
    }

    public record AuthResult(String token, Customer customer) {}

    @Transactional
    public AuthResult register(String fullName, String email, String phone, String password) {
        String normalized = normalizeEmail(email);
        validatePassword(password);
        if (customers.existsByEmailIgnoreCase(normalized)) {
            throw emailTaken();
        }
        Customer customer;
        try {
            customer = customers.saveAndFlush(
                    new Customer(normalized, encoder.encode(password), fullName.trim(), blankToNull(phone)));
        } catch (DataIntegrityViolationException race) {
            throw emailTaken();
        }
        return new AuthResult(issueToken(customer), customer);
    }

    @Transactional
    public AuthResult login(String email, String password) {
        Optional<Customer> found = customers.findByEmailIgnoreCase(normalizeEmail(email));
        String hash = found.map(Customer::getPasswordHash).orElse(dummyHash);
        boolean matches = encoder.matches(password == null ? "" : password, hash);
        if (found.isEmpty() || !matches) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Incorrect email or password.");
        }
        return new AuthResult(issueToken(found.get()), found.get());
    }

    /** Resolves "Authorization: Bearer xxx" to a customer, or empty if missing/invalid/expired. */
    @Transactional(readOnly = true)
    public Optional<Customer> resolve(String authorizationHeader) {
        String token = extractToken(authorizationHeader);
        if (token == null) return Optional.empty();
        return tokens.findByTokenHash(sha256(token))
                .filter(t -> t.getExpiresAt().isAfter(Instant.now()))
                .map(AuthToken::getCustomer);
    }

    public Customer requireCustomer(String authorizationHeader) {
        return resolve(authorizationHeader)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please log in to continue."));
    }

    @Transactional
    public void logout(String authorizationHeader) {
        String token = extractToken(authorizationHeader);
        if (token != null) {
            tokens.deleteByTokenHash(sha256(token));
        }
    }

    @Transactional
    public Customer updateProfile(Customer customer, String fullName, String phone) {
        Customer managed = customers.findById(customer.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please log in to continue."));
        managed.setFullName(fullName.trim());
        managed.setPhone(blankToNull(phone));
        return customers.save(managed);
    }

    /**
     * Admin action. Removes the account and logs the person out everywhere, but KEEPS their
     * orders (detached from the account) — order records are needed for fulfilment, refunds
     * and tax, and each order already carries its own name/email/address snapshot.
     */
    @Transactional
    public void deleteAccount(Long customerId) {
        Customer customer = customers.findById(customerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found"));
        List<Order> theirOrders = orders.findByCustomerOrderByCreatedAtDesc(customer);
        for (Order order : theirOrders) {
            order.setCustomer(null);
        }
        orders.saveAll(theirOrders);
        tokens.deleteByCustomer(customer);
        customers.delete(customer);
    }

    // ---------------------------------------------------------------- helpers

    private String issueToken(Customer customer) {
        tokens.deleteByExpiresAtBefore(Instant.now()); // tidy up stale sessions as we go
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        tokens.save(new AuthToken(sha256(token), customer, Instant.now().plus(TOKEN_TTL)));
        return token;
    }

    private static String extractToken(String header) {
        if (header == null) return null;
        String trimmed = header.trim();
        if (trimmed.length() < 8 || !trimmed.regionMatches(true, 0, "Bearer ", 0, 7)) return null;
        String token = trimmed.substring(7).trim();
        return token.isEmpty() ? null : token;
    }

    private static String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please enter your email address.");
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private static void validatePassword(String password) {
        if (password == null || password.length() < 8) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Your password must be at least 8 characters.");
        }
        if (password.getBytes(StandardCharsets.UTF_8).length > MAX_PASSWORD_BYTES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "That password is too long (72 characters maximum).");
        }
    }

    private static ResponseStatusException emailTaken() {
        return new ResponseStatusException(HttpStatus.CONFLICT,
                "An account with that email already exists. Try logging in instead.");
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    static String sha256(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : digest) hex.append(String.format("%02x", b));
            return hex.toString();
        } catch (Exception e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}