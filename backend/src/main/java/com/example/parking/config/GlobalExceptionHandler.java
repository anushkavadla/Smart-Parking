package com.example.parking.config;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log =
            LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // Fragments that indicate a framework/database/stack-trace message.
    // Such messages stay in server logs and are never sent to clients.
    private static final String[] INTERNAL_MARKERS = {
            "sql", "jdbc", "hibernate", "constraint", "dataintegrity",
            "org.springframework", "org.hibernate", "jakarta.",
            "java.lang.", "caused by", "stacktrace", ".java:",
            "querydsl", "table ", "column ",
    };

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntime(
            RuntimeException ex) {

        // Server log keeps the detail; the client only gets a vetted message.
        log.warn("Request failed: {}: {}",
                ex.getClass().getSimpleName(),
                ex.getMessage());

        String message = safeClientMessage(ex.getMessage());

        HttpStatus status = HttpStatus.BAD_REQUEST;

        String lower = message.toLowerCase();
        if (lower.contains("not allowed")
                || lower.contains("forbidden")) {
            status = HttpStatus.FORBIDDEN;
        } else if (lower.contains("not found")) {
            status = HttpStatus.NOT_FOUND;
        } else if (lower.contains("too many requests")) {
            status = HttpStatus.TOO_MANY_REQUESTS;
        }

        return ResponseEntity
                .status(status)
                .body(Map.of("error", message));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(
            MethodArgumentNotValidException ex) {

        String message = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(error -> error.getField()
                        + ": "
                        + error.getDefaultMessage())
                .findFirst()
                .orElse("Validation failed");

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", message));
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<Map<String, String>> handleAuth(
            AuthenticationException ex) {
        log.warn("Authentication failed: {}",
                ex.getClass().getSimpleName());
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Unauthorized"));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, String>> handleDenied(
            AccessDeniedException ex) {
        log.warn("Access denied: {}", ex.getClass().getSimpleName());
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(Map.of("error", "Forbidden"));
    }

    @ExceptionHandler({
            HttpMessageNotReadableException.class,
            MethodArgumentTypeMismatchException.class,
    })
    public ResponseEntity<Map<String, String>> handleBadRequest(
            Exception ex) {
        log.warn("Bad request: {}",
                ex.getClass().getSimpleName());
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", "Invalid request"));
    }

    // Catch-all: never leak stack traces, SQL, paths or internals.
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleUnexpected(
            Exception ex) {
        log.error("Unexpected error: {}",
                ex.getClass().getName(), ex);
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Internal server error"));
    }

    // Short human-written service messages pass through so the UI keeps
    // working ("Slot not available", "Invalid payment reference", ...).
    // Anything long or framework-looking becomes a generic message.
    private static String safeClientMessage(String message) {
        if (message == null || message.isBlank()) {
            return "Request failed";
        }
        String trimmed = message.strip();
        if (trimmed.length() > 200) {
            return "Request failed";
        }
        String lower = trimmed.toLowerCase();
        for (String marker : INTERNAL_MARKERS) {
            if (lower.contains(marker)) {
                return "Request failed";
            }
        }
        return trimmed;
    }
}
