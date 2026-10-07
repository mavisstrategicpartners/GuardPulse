package com.guardpulse.backend.customer;

import com.guardpulse.backend.mail.MailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * Sends the "forgot password" email. Separate from AuthService so that AuthService stays
 * focused on data, and so the @Async boundary (see OrderNotifier for why this matters —
 * a slow/down SMTP server must never make the HTTP request wait) is in one obvious place.
 */
@Component
public class PasswordResetMailer {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetMailer.class);

    private final MailService mailService;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    public PasswordResetMailer(MailService mailService) {
        this.mailService = mailService;
    }

    @Async("mailExecutor")
    public void sendResetLink(Customer customer, String rawToken) {
        String link = frontendUrl.replaceAll("/+$", "") + "/reset-password?token=" + rawToken;
        String body = """
                Hi %s,

                We received a request to reset your GuardPulse account password.

                Reset it here (this link works once and expires in 1 hour):
                %s

                If you didn't ask for this, you can safely ignore this email — your
                password hasn't been changed.

                — GuardPulse
                """.formatted(firstName(customer.getFullName()), link);

        try {
            mailService.send(customer.getEmail(), "Reset your GuardPulse password", body);
        } catch (Exception e) {
            log.error("Failed to send password reset email to {}", customer.getEmail(), e);
        }
    }

    private static String firstName(String fullName) {
        if (fullName == null || fullName.isBlank()) return "there";
        return fullName.trim().split("\\s+")[0];
    }
}
