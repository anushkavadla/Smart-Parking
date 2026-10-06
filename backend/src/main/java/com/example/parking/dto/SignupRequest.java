package com.example.parking.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SignupRequest {

    @NotBlank
    @Size(max = 100)
    @Pattern(regexp = "^[^<>]*$",
            message = "Invalid characters in name")
    private String name;

    @NotBlank
    @Email
    @Size(max = 100)
    private String email;

    @NotBlank
    @Size(min = 8, max = 100)
    // Modest complexity for new passwords: letters + digits.
    // Login intentionally has no complexity rule so existing
    // passwords keep working.
    @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).{8,100}$",
            message = "Password must contain letters and digits")
    private String password;
}