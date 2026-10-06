package com.example.parking.security;

import java.io.IOException;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.example.parking.service.UserRoleService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRoleService userRoleService;

    public JwtAuthenticationFilter(
            JwtService jwtService,
            // Lazy to avoid any startup ordering cycle; UserRoleService
            // only needs UserRepository.
            @org.springframework.context.annotation.Lazy
            UserRoleService userRoleService) {
        this.jwtService = jwtService;
        this.userRoleService = userRoleService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        if (token.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            if (!jwtService.isTokenValid(token)) {
                SecurityContextHolder.clearContext();
                filterChain.doFilter(request, response);
                return;
            }

            String email = jwtService.extractEmail(token);

            // Authoritative role comes from the database, never from the
            // client or the token claim alone.
            String role = userRoleService.roleOf(email);

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            email,
                            null,
                            java.util.List.of(
                                    new SimpleGrantedAuthority(
                                            "ROLE_" + role))
                    );

            SecurityContextHolder.getContext()
                    .setAuthentication(authentication);
        } catch (Exception e) {
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }
}