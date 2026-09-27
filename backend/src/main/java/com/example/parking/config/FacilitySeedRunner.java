package com.example.parking.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.example.parking.service.FacilitySeedService;

@Component
public class FacilitySeedRunner implements CommandLineRunner {

    private final FacilitySeedService facilitySeedService;

    public FacilitySeedRunner(FacilitySeedService facilitySeedService) {
        this.facilitySeedService = facilitySeedService;
    }

    @Override
    public void run(String... args) {
        facilitySeedService.seedIfNeeded();
    }
}
