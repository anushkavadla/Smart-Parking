package com.example.parking.security;

import java.io.IOException;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

// Minimal in-memory rate limiter for authentication endpoints.
// No Redis/infra needed for this single-instance application.
// Only POST /api/auth/login and POST /api/auth/signup are limited;
// normal parking operations are untouched.
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class AuthRateLimitFilter extends OncePerRequestFilter {

    // 10 attempts per minute per client IP per endpoint: generous for
    // humans (signup immediately followed by login = 2 requests) but
    // slows credential-stuffing/brute-force scripts.
    private static final int MAX_ATTEMPTS = 10;
    private static final long WINDOW_MS = 60_000L;
    private static final int MAX_TRACKED_KEYS = 10_000;

    private final Map<String, Deque<Long>> attempts = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        if (!isAuthAttempt(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        String key = rateLimitKey(request);
        long now = System.currentTimeMillis();

        Deque<Long> timestamps = attempts.computeIfAbsent(
                key, k -> new ArrayDeque<>());

        boolean limited;
        synchronized (timestamps) {
            while (!timestamps.isEmpty()
                    && now - timestamps.peekFirst() > WINDOW_MS) {
                timestamps.pollFirst();
            }
            if (timestamps.size() >= MAX_ATTEMPTS) {
                limited = true;
            } else {
                timestamps.addLast(now);
                limited = false;
            }
        }

        if (attempts.size() > MAX_TRACKED_KEYS) {
            attempts.clear();
        }

        if (limited) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setHeader("Retry-After", "60");
            response.getWriter().write(
                    "{\"error\":\"Too many requests, please try again later\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private static boolean isAuthAttempt(HttpServletRequest request) {
        if (!"POST".equalsIgnoreCase(request.getMethod())) {
            return false;
        }
        String path = request.getRequestURI();
        return "/api/auth/login".equals(path)
                || "/api/auth/signup".equals(path);
    }

    private static String rateLimitKey(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        String ip = (forwarded != null && !forwarded.isBlank())
                ? forwarded.split(",")[0].trim()
                : request.getRemoteAddr();
        return request.getMethod() + " " + request.getRequestURI() + "|" + ip;
    }
}
