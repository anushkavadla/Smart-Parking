# Smart Parking & Vehicle Management Platform

A full-stack web application for managing parking lots, parking levels, parking slots, vehicles, parking sessions, reservations, parking fees, and checkout payments.

The system is designed as a scalable parking management platform that can be adapted for different parking facilities such as commercial buildings, offices, apartments, hospitals, malls, and other parking environments.

---

## Project Overview

Managing parking spaces manually can make it difficult to track available slots, vehicles, parking sessions, and parking fees.

The **Smart Parking & Vehicle Management Platform** provides a centralized web-based system where users can:

- Register and manage their vehicles
- View available parking slots
- Select parking levels
- Find suitable parking slots based on vehicle type
- Check vehicles into parking slots
- Track active parking sessions
- Calculate parking fees based on parking duration
- Reserve parking slots
- Complete checkout with payment
- View parking history

The system also provides administrative functionality for managing parking levels, parking slots, and parking slot status.

---

## Main Objectives

- Automate parking slot management
- Reduce manual parking management
- Provide parking availability information
- Support multiple parking levels
- Manage different vehicle types and slot sizes
- Track vehicle check-in and check-out
- Calculate parking fees automatically
- Maintain parking history
- Provide role-based access for users and administrators
- Demonstrate full-stack development using Java, Spring Boot, Maven, React, and MySQL

---

# Features

## 1. User Authentication

The system provides secure user authentication using JWT.

Features include:

- User registration
- User login
- JWT-based authentication
- Password encryption using BCrypt
- Role-based access control
- Protected API endpoints

---

## 2. Vehicle Management

Users can manage their registered vehicles.

Features include:

- Add vehicles
- View vehicles
- Update vehicle details
- Delete vehicles
- Manage multiple vehicles

### Supported Vehicle Types

| Vehicle Type | Parking Slot Size |
|--------------|-------------------|
| Two Wheeler | SMALL |
| Car | MEDIUM |
| Heavy Vehicle | LARGE |

---

## 3. Parking Level Management

The parking facility supports multiple parking levels:

```text
P1
P2
P3
