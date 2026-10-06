package com.example.parking.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.parking.dto.UserResponse;
import com.example.parking.model.User;
import com.example.parking.repository.UserRepository;
import com.example.parking.service.UserRoleService;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final UserRoleService userRoleService;

    public UserController(
            UserRepository userRepository,
            UserRoleService userRoleService) {
        this.userRepository = userRepository;
        this.userRoleService = userRoleService;
    }

    // Self profile for the authenticated user. Normal users use this;
    // it never exposes other users' data.
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(
            Authentication authentication) {

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        UserResponse dto = new UserResponse();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setRole(userRoleService.roleOf(user.getEmail()));

        return ResponseEntity.ok(dto);
    }

    // Admin-only user enumeration.
    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers(
            Authentication authentication) {

        userRoleService.requireAdmin(authentication.getName());

        List<User> users = userRepository.findAll();

        List<UserResponse> response = users.stream().map(user -> {
            UserResponse dto = new UserResponse();
            dto.setId(user.getId());
            dto.setName(user.getName());
            dto.setEmail(user.getEmail());
            return dto;
        }).toList();

        return ResponseEntity.ok(response);
    }
}