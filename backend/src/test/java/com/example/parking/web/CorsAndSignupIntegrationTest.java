package com.example.parking.web;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Integration tests for CORS and signup against the real security
 * filter chain (SecurityConfig + JwtAuthenticationFilter +
 * AuthRateLimitFilter). Uses an in-memory H2 database and a test-only
 * JWT secret so no MySQL instance or real secret is required.
 */
@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:corstest;MODE=MySQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "app.jwt.secret=test-only-jwt-signing-secret-0123456789abcdef"
})
@AutoConfigureMockMvc
class CorsAndSignupIntegrationTest {

    private static final String DEPLOYED_FRONTEND =
        "https://smart-parking-frontend-final.onrender.com";

    private static final String UNKNOWN_ORIGIN =
        "https://evil.example.com";

    @Autowired
    private MockMvc mockMvc;

    @Test
    void preflightFromDeployedFrontendIsAllowed() throws Exception {
        mockMvc.perform(options("/api/auth/signup")
                .header(HttpHeaders.ORIGIN, DEPLOYED_FRONTEND)
                .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST")
                .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS,
                    "Authorization,Content-Type,Accept"))
            .andExpect(status().isOk())
            .andExpect(header().string(
                HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, DEPLOYED_FRONTEND))
            .andExpect(header().string(
                HttpHeaders.ACCESS_CONTROL_ALLOW_METHODS,
                containsString("POST")))
            .andExpect(header().string(
                HttpHeaders.ACCESS_CONTROL_ALLOW_METHODS,
                containsString("PATCH")))
            .andExpect(header().string(
                HttpHeaders.ACCESS_CONTROL_ALLOW_HEADERS,
                containsString("Authorization")))
            .andExpect(header().string(
                HttpHeaders.ACCESS_CONTROL_ALLOW_HEADERS,
                containsString("Content-Type")))
            .andExpect(header().string(
                HttpHeaders.ACCESS_CONTROL_ALLOW_HEADERS,
                containsString("Accept")))
            // Bearer-token auth needs no cookies: the server must not
            // promise credentialed responses.
            .andExpect(header().doesNotExist(
                HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS));
    }

    @Test
    void preflightFromUnknownOriginIsRejected() throws Exception {
        mockMvc.perform(options("/api/auth/signup")
                .header(HttpHeaders.ORIGIN, UNKNOWN_ORIGIN)
                .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST"))
            .andExpect(status().isForbidden())
            .andExpect(header().doesNotExist(
                HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN));
    }

    @Test
    void preflightOnProtectedEndpointIsHandledBeforeAuthentication()
            throws Exception {
        // /api/vehicles requires an authenticated caller; the OPTIONS
        // preflight carries no token and must still be answered by the
        // CORS filter with 200, not rejected as 401 by security.
        mockMvc.perform(options("/api/vehicles")
                .header(HttpHeaders.ORIGIN, DEPLOYED_FRONTEND)
                .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET"))
            .andExpect(status().isOk())
            .andExpect(header().string(
                HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, DEPLOYED_FRONTEND));
    }

    @Test
    void signupFromDeployedFrontendSucceedsWithCorsHeaders()
            throws Exception {
        mockMvc.perform(post("/api/auth/signup")
                .header(HttpHeaders.ORIGIN, DEPLOYED_FRONTEND)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "name": "Cors Tester",
                      "email": "cors.test@example.com",
                      "password": "TestPass123"
                    }
                    """))
            .andExpect(status().isCreated())
            .andExpect(header().string(
                HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, DEPLOYED_FRONTEND));
    }

    @Test
    void signupRequestFromUnknownOriginIsRejected() throws Exception {
        mockMvc.perform(post("/api/auth/signup")
                .header(HttpHeaders.ORIGIN, UNKNOWN_ORIGIN)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "name": "Evil Tester",
                      "email": "evil.cors@example.com",
                      "password": "TestPass123"
                    }
                    """))
            .andExpect(status().isForbidden());
    }
}
