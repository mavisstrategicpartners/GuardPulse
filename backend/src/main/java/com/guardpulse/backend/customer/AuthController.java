package com.guardpulse.backend.customer;

import com.guardpulse.backend.orders.OrderRepository;
import com.guardpulse.backend.orders.dto.OrderDto;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final OrderRepository orderRepository;

    public AuthController(AuthService authService, OrderRepository orderRepository) {
        this.authService = authService;
        this.orderRepository = orderRepository;
    }

    public static class RegisterRequest {
        @NotBlank @Size(max = 120)
        public String fullName;
        @NotBlank @Email @Size(max = 254)
        public String email;
        @Size(max = 30)
        public String phone;
        @NotBlank @Size(min = 8, max = 72)
        public String password;
    }

    public static class LoginRequest {
        @NotBlank
        public String email;
        @NotBlank
        public String password;
    }

    public static class UpdateProfileRequest {
        @NotBlank @Size(max = 120)
        public String fullName;
        @Size(max = 30)
        public String phone;
    }

    public record AuthResponse(String token, CustomerDto customer) {}

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthService.AuthResult result = authService.register(
                request.fullName, request.email, request.phone, request.password);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new AuthResponse(result.token(), CustomerDto.from(result.customer())));
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        AuthService.AuthResult result = authService.login(request.email, request.password);
        return new AuthResponse(result.token(), CustomerDto.from(result.customer()));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestHeader(value = "Authorization", required = false) String authorization) {
        authService.logout(authorization);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public CustomerDto me(@RequestHeader(value = "Authorization", required = false) String authorization) {
        return CustomerDto.from(authService.requireCustomer(authorization));
    }

    @PatchMapping("/me")
    public CustomerDto updateMe(@RequestHeader(value = "Authorization", required = false) String authorization,
                                @Valid @RequestBody UpdateProfileRequest request) {
        Customer customer = authService.requireCustomer(authorization);
        return CustomerDto.from(authService.updateProfile(customer, request.fullName, request.phone));
    }

    @GetMapping("/orders")
    public List<OrderDto> myOrders(@RequestHeader(value = "Authorization", required = false) String authorization) {
        Customer customer = authService.requireCustomer(authorization);
        return orderRepository.findByCustomerOrderByCreatedAtDesc(customer).stream().map(OrderDto::from).toList();
    }
}