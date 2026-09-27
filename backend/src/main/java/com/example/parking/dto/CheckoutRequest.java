package com.example.parking.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

// Simulated payment confirmation sent with check-out. Card/UPI
// credentials are NEVER sent here — only the chosen method and an
// optional client-side reference (e.g. a UPI UTR). The server
// generates the canonical payment reference when absent.
@Data
public class CheckoutRequest {

    private String paymentMethod;

    @Size(max = 40)
    private String paymentReference;
}
