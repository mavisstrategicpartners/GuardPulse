package com.guardpulse.backend.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * A deliberately simple fixed-window rate limiter, scoped to the endpoints someone could
 * actually abuse (cart mutation, checkout) rather than the whole API. Good enough to stop
 * casual scripted abuse of a small store; not a substitute for a real WAF/CDN-level limiter
 * (Cloudflare, etc.) if this ever needs to withstand a deliberate attack.
 *
 * In-memory only — fine for a single instance. If this backend ever runs as more than one
 * instance behind a load balancer, move this state to Redis instead (each instance otherwise
 * enforces its own separate limit, which just multiplies the effective allowance).
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    @Value("${ratelimit.requests-per-minute:60}")
    private int limitPerMinute;

    private static final int AUTH_LIMIT_PER_MINUTE = 20;

    private record Window(AtomicInteger count, long windowStartEpochSecond) {}

    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        boolean limited = path.startsWith("/api/cart") || path.startsWith("/api/orders")
                || path.startsWith("/api/payments") || path.startsWith("/api/auth");
        return !limited;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        // Login/register get a much tighter budget (and their own counter) to slow down password guessing.
        boolean authPath = request.getRequestURI().startsWith("/api/auth");
        int limit = authPath ? Math.min(limitPerMinute, AUTH_LIMIT_PER_MINUTE) : limitPerMinute;
        String ip = clientIp(request) + (authPath ? "|auth" : "");
        long nowSecond = Instant.now().getEpochSecond();
        long currentWindow = nowSecond / 60;

        Window window = windows.compute(ip, (key, existing) -> {
            if (existing == null || existing.windowStartEpochSecond() != currentWindow) {
                return new Window(new AtomicInteger(0), currentWindow);
            }
            return existing;
        });

        int count = window.count().incrementAndGet();
        if (count > limit) {
            response.setStatus(429); // Too Many Requests
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Too many requests — please slow down and try again shortly.\"}");
            return;
        }

        // Occasional opportunistic cleanup so this map doesn't grow forever under varied IPs.
        if (windows.size() > 10_000) {
            windows.entrySet().removeIf(e -> e.getValue().windowStartEpochSecond() != currentWindow);
        }

        chain.doFilter(request, response);
    }

    private static String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim(); // leftmost = original client, when behind a trusted proxy
        }
        return request.getRemoteAddr();
    }
}