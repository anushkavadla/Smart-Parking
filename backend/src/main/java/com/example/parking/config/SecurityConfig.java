package com.example.parking.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.example.parking.security.JwtAuthenticationFilter;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {

        http
                // Disable CSRF for REST APIs
                .csrf(csrf -> csrf.disable())

                // Enable CORS
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // Stateless authentication
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // Authorization
                .authorizeHttpRequests(auth -> auth

                        // Authentication APIs
                        .requestMatchers("/api/auth/**").permitAll()

                        // Error endpoint
                        .requestMatchers("/error").permitAll()

                        // Self profile stays available to any signed-in user
                        .requestMatchers(HttpMethod.GET, "/api/users/me")
                        .authenticated()

                        // Admin-only: user enumeration (service also enforces)
                        .requestMatchers(HttpMethod.GET, "/api/users")
                        .hasRole("ADMIN")

                        // Admin-only writes (services also enforce)
                        .requestMatchers(HttpMethod.POST, "/api/parking-lots")
                        .hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/parking-levels")
                        .hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/parking-slots/**")
                        .hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/parking-slots/**")
                        .hasRole("ADMIN")

                        // Everything else requires JWT
                        .anyRequest().authenticated()
                )

                // Proper JSON 401/403 instead of default HTML pages
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authEx) -> {
                            response.setStatus(HttpStatus.UNAUTHORIZED.value());
                            response.setContentType(
                                    MediaType.APPLICATION_JSON_VALUE);
                            response.getWriter().write(
                                    "{\"error\":\"Unauthorized\"}");
                        })
                        .accessDeniedHandler((request, response, accessEx) -> {
                            response.setStatus(HttpStatus.FORBIDDEN.value());
                            response.setContentType(
                                    MediaType.APPLICATION_JSON_VALUE);
                            response.getWriter().write(
                                    "{\"error\":\"Forbidden\"}");
                        }))

                // Security headers (API-safe; no HSTS — local HTTP only).
                // CSP is deliberately minimal for JSON APIs and does not
                // affect the React document (Vite/Three.js untouched).
                .headers(headers -> headers
                        .contentTypeOptions(contentType -> {
                        })
                        .frameOptions(frame -> frame.deny())
                        .referrerPolicy(referrer -> referrer
                                .policy(org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy.NO_REFERRER))
                        .permissionsPolicyHeader(permissions -> permissions
                                .policy("geolocation=(), microphone=(), camera=(), payment=()"))
                        .contentSecurityPolicy(csp -> csp
                                .policyDirectives(
                                        "default-src 'none'; frame-ancestors 'none'")));

        // JWT filter
        http.addFilterBefore(
                jwtAuthenticationFilter,
                UsernamePasswordAuthenticationFilter.class
        );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration config = new CorsConfiguration();

        // Exact frontend origins only. Never "*" with credentials and
        // never arbitrary localhost ports: http://localhost:5173 is the
        // Vite dev server (see frontend/smartpark/vite.config.js).
        config.setAllowedOrigins(List.of(
                "http://localhost:5173",
                "http://127.0.0.1:5173"
        ));

        config.setAllowedMethods(List.of(
                "GET",
                "POST",
                "PUT",
                "DELETE",
                "PATCH",
                "OPTIONS"
        ));

        config.setAllowedHeaders(List.of(
                "Authorization",
                "Content-Type",
                "Accept",
                "Origin",
                "X-Requested-With"
        ));

        config.setAllowCredentials(true);

        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", config);

        return source;
    }
}