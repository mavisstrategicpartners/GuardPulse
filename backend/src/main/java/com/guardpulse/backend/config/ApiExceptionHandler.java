package com.guardpulse.backend.config;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {

    // Existing behaviour: anything thrown deliberately (ResponseStatusException) already
    // carries its own clear reason - e.g. "An account with that email already exists."
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handleResponseStatus(ResponseStatusException ex) {
        String message = ex.getReason() != null ? ex.getReason() : "Something went wrong.";
        return ResponseEntity.status(ex.getStatusCode()).body(Map.of("message", message));
    }

    // @Valid failures on a request body (e.g. RegisterRequest) - this is almost certainly
    // what's been swallowed, producing Register.tsx's generic fallback text. Spring's default
    // shape for this exception doesn't have a top-level "message" field, so the frontend's
    // errorMessage(err, fallback) helper always fell through to the fallback. This surfaces
    // the real reason (e.g. "password must be at least 8 characters").
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(fe -> fe.getField() + " " + fe.getDefaultMessage())
                .orElse("Please check your details and try again.");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", message));
    }

    // Malformed JSON body (rare, but another source of an unmapped 400).
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> handleUnreadable(HttpMessageNotReadableException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", "We couldn't read that request. Please try again."));
    }

    // Last-resort safety net so an unexpected 500 also shows something useful instead of
    // the browser's own generic network-error text.
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleUnexpected(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Something went wrong on our side. Please try again shortly."));
    }
}