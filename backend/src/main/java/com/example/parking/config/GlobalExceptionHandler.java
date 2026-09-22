package com.example.parking.config;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntime(
            RuntimeException ex) {

        String message = ex.getMessage() != null
                ? ex.getMessage()
                : "Request failed";

        HttpStatus status = HttpStatus.BAD_REQUEST;

        if (message.toLowerCase().contains("not allowed")
                || message.toLowerCase().contains("forbidden")) {
            status = HttpStatus.FORBIDDEN;
        } else if (message.toLowerCase().contains("not found")) {
            status = HttpStatus.NOT_FOUND;
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
}
