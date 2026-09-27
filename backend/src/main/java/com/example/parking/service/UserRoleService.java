package com.example.parking.service;

import org.springframework.stereotype.Service;

import com.example.parking.repository.UserRepository;

@Service
public class UserRoleService {

    private final UserRepository userRepository;

    public UserRoleService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // Existing rows have NULL roles; they keep working as plain users.
    public String roleOf(String email) {
        return userRepository.findByEmail(email)
                .map(user -> user.getRole() == null
                        ? "USER"
                        : user.getRole().toUpperCase())
                .orElse("USER");
    }

    // "Forbidden..." maps to HTTP 403 in GlobalExceptionHandler.
    public void requireAdmin(String email) {
        if (!"ADMIN".equals(roleOf(email))) {
            throw new RuntimeException("Forbidden: admin only");
        }
    }
}
