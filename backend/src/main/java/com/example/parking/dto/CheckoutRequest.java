package com.example.parking.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

// Simulated payment confirmation sent with check-out. Card/UPI
// credentials are NEVER sent here — only the chosen method and an
// optional client-side reference (e.g. a UPI UTR). The server
// generates the canonical payment reference when absent.
@Data
public class CheckoutRequest {

    // Whitelist enforced here AND in ParkingSessionService.checkOut.
    @Pattern(regexp = "(?i)^(UPI|CARD|CASH)$",
            message = "Payment method must be UPI, CARD or CASH")
    private String paymentMethod;

    @Size(max = 40)
    @Pattern(regexp = "^[A-Za-z0-9\\-]{0,40}$",
            message = "Invalid payment reference")
    private String paymentReference;
}
