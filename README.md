# Smart Parking & Vehicle Management Platform

A full-stack web-based parking management system designed to manage parking facilities, vehicles, parking slots, parking sessions, reservations, and parking payments.

## Project Overview

The Smart Parking & Vehicle Management Platform is a full-stack web application developed to provide a centralized solution for managing parking facilities and vehicles.

Traditional parking systems may rely on manual tracking of available slots, vehicle entries and exits, parking duration, and fee calculation. This project provides a digital solution where users can register vehicles, view parking availability, select compatible parking slots, start parking sessions, complete checkout and payment, and view their parking history.

The system supports multiple parking levels, different parking slot sizes, vehicle-specific slot compatibility, reservations, parking session management, and an interactive 3D visualization of the parking facility.

## Main Objectives

- Develop a complete full-stack web application.
- Implement backend business logic using Java and Spring Boot.
- Build REST APIs for communication between frontend and backend.
- Manage application data using MySQL.
- Implement database operations using Spring Data JPA and Hibernate.
- Provide vehicle and parking slot management.
- Support multiple parking levels such as P1, P2, and P3.
- Provide real-time parking availability.
- Implement parking check-in and check-out.
- Calculate parking fees based on parking duration.
- Provide a payment flow during checkout.
- Provide an interactive 3D parking visualization.
- Demonstrate practical implementation of a layered Spring Boot architecture.

## Key Features

### User Management

- User registration
- User login
- JWT-based authentication
- User profile
- User roles
- Protected application routes

### Vehicle Management

- Add vehicles
- View registered vehicles
- Update vehicle information
- Delete vehicles
- Vehicle type validation
- Vehicle-specific parking compatibility

### Parking Management

- Multiple parking levels
- P1, P2, and P3 parking levels
- Parking slot management
- Real-time availability
- Slot status management
- Compatible slot selection
- Find suitable parking slot
- Level-wise parking statistics

### Parking Sessions

- Vehicle check-in
- Active parking session
- Parking duration tracking
- Parking fee calculation
- Vehicle check-out
- Parking history

### Reservations

- Create parking reservations
- View reservations
- Cancel reservations
- Reserved slot status
- Reservation completion during checkout

### Payment

The checkout process supports:

- UPI
- Card
- Cash

The system records the payment status, payment method, payment reference, and payment time.

### 3D Parking Visualization

The frontend provides an interactive 3D representation of the parking facility.

It includes:

- Multiple parking levels
- Parking bays
- Vehicle models
- Parking slot status
- Entry and exit areas
- Parking lanes
- Slot labels
- Interactive camera controls
- Slot selection
- Vehicle-specific slot sizes

## Vehicle and Parking Slot Classification

Parking slots are divided into three sizes according to vehicle type.

| Slot Size | Vehicle Type | Example |
|---|---|---|
| SMALL | Two-wheeler | Motorcycle / Scooter |
| MEDIUM | Four-wheeler | Car / SUV / Sedan |
| LARGE | Heavy Vehicle | Truck / Heavy Vehicle |

A vehicle can only be assigned to a parking slot compatible with its vehicle type.

For example:

```text
SMALL  → Two-wheeler
MEDIUM → Car
LARGE  → Heavy Vehicle
```

## Parking Levels

The parking facility is divided into multiple levels.

```text
Parking System
│
├── P1
│   ├── SMALL
│   ├── MEDIUM
│   └── LARGE
│
├── P2
│   ├── SMALL
│   ├── MEDIUM
│   └── LARGE
│
└── P3
    ├── SMALL
    ├── MEDIUM
    └── LARGE
```

Parking slots use level-based identifiers such as:

```text
P1-S01
P1-M01
P1-L01

P2-S01
P2-M01
P2-L01

P3-S01
P3-M01
P3-L01
```

Where:

```text
S → Small
M → Medium
L → Large
```

## Parking Slot Status

The system supports multiple parking slot states:

- AVAILABLE
- OCCUPIED
- RESERVED
- OUT_OF_SERVICE
- SELECTED
- ACTIVE SESSION

The 3D parking visualization represents these states using different colors and visual indicators.

## Parking Workflow

### 1. User Registration

A new user creates an account using the registration page.

### 2. User Login

The registered user logs into the application.

JWT authentication is used to protect application resources.

### 3. Vehicle Registration

The user registers their vehicle by providing vehicle information.

### 4. Parking Availability

The user opens the parking section and views available parking levels and slots.

### 5. Find Compatible Slot

The system checks vehicle type and slot size compatibility before suggesting a parking slot.

### 6. Select Parking Slot

The user selects an available compatible parking slot.

### 7. Vehicle Check-in

A parking session is created when the vehicle enters the selected parking slot.

The slot status changes to:

```text
AVAILABLE → OCCUPIED
```

### 8. Active Parking

The Active Parking page displays information such as:

- Vehicle
- Parking level
- Parking slot
- Check-in time
- Parking duration
- Parking rate
- Current parking fee

### 9. Checkout

The user initiates checkout from the active parking session.

The system calculates the final parking fee.

### 10. Payment

The user selects a payment method:

```text
UPI
CARD
CASH
```

After successful payment, the parking session is completed.

The slot becomes available again:

```text
OCCUPIED → AVAILABLE
```

### 11. Parking History

Completed parking sessions are stored and displayed in the user's parking history.

## Parking Fee Calculation

The parking fee is calculated according to the parking duration and applicable parking rate.

Basic calculation:

```text
Parking Fee = Parking Duration × Parking Rate
```

Different parking slot sizes can have different rates.

Example:

```text
SMALL  → Two-wheeler rate
MEDIUM → Car rate
LARGE  → Heavy vehicle rate
```

The actual rates are configured by the application.

## Payment Flow

The checkout process follows this flow:

```text
Active Parking
      |
      v
Checkout
      |
      v
Calculate Parking Fee
      |
      v
Select Payment Method
      |
      +------ UPI
      |
      +------ CARD
      |
      +------ CASH
      |
      v
Payment Validation
      |
      v
Payment Recorded
      |
      v
Parking Session Completed
      |
      v
Parking Slot Released
      |
      v
Receipt / History
```

## System Architecture

The project follows a client-server architecture with a layered Spring Boot backend.

```text
                    USER
                      |
                      v
             REACT FRONTEND
                + VITE
                      |
                      |
                  REST API
                      |
                      v
             SPRING BOOT BACKEND
                      |
          +-----------+-----------+
          |                       |
          v                       v
     CONTROLLERS              SERVICES
          |                       |
          |                       v
          |                  REPOSITORIES
          |                       |
          +-----------+-----------+
                      |
                      v
                 SPRING DATA JPA
                      |
                      v
                   MYSQL
```

## Backend Architecture

The backend follows a layered architecture.

```text
Controller
     |
     v
Service
     |
     v
Repository
     |
     v
Database
```

### Controller Layer

The Controller layer handles HTTP requests and exposes REST API endpoints.

Examples include:

- Authentication Controller
- Parking Slot Controller
- Parking Session Controller
- Parking Level Controller
- Reservation Controller
- Vehicle Controller
- User Controller

### Service Layer

The Service layer contains the application's main business logic.

Examples:

- Authentication logic
- Vehicle management
- Parking slot availability
- Slot compatibility
- Check-in processing
- Check-out processing
- Fee calculation
- Reservation processing
- Payment validation

### Repository Layer

The Repository layer communicates with the MySQL database through Spring Data JPA.

Repositories provide database operations without requiring manual SQL for common CRUD operations.

### Model Layer

The Model layer contains JPA entity classes representing database tables.

Main entities include:

- User
- Vehicle
- ParkingLevel
- ParkingSlot
- ParkingSession
- Reservation

### DTO Layer

DTOs (Data Transfer Objects) are used to transfer structured data between the frontend and backend.

They help separate API request/response data from database entities.

### Configuration Layer

The configuration layer contains application startup and facility initialization logic.

For example:

- Facility seed configuration
- Initial parking level creation
- Initial parking slot creation
- Facility reconciliation

## Backend Project Structure

```text
backend/
│
├── src/
│   └── main/
│       ├── java/
│       │   └── com/
│       │       └── example/
│       │           └── parking/
│       │               │
│       │               ├── config/
│       │               │
│       │               ├── controller/
│       │               │
│       │               ├── dto/
│       │               │
│       │               ├── model/
│       │               │
│       │               ├── repository/
│       │               │
│       │               └── service/
│       │
│       └── resources/
│           └── application.properties
│
└── pom.xml
```

## Frontend Architecture

The frontend is developed using React and Vite.

The frontend communicates with the Spring Boot backend through REST APIs.

## Frontend Structure

```text
frontend/
│
└── smartpark/
    │
    ├── public/
    │
    ├── src/
    │   ├── api/
    │   ├── auth/
    │   ├── components/
    │   ├── layouts/
    │   ├── pages/
    │   └── utils/
    │
    ├── package.json
    ├── vite.config.js
    └── index.html
```

## Main Frontend Pages

### Home

Displays overall parking information and system statistics.

### Parking

Provides:

- Parking level selection
- Parking slot visualization
- Slot availability
- Compatible slot selection
- 3D parking facility

### Active Parking

Displays active parking sessions and allows the user to proceed to checkout.

### Checkout

Handles:

- Parking fee calculation
- Payment method selection
- Payment validation
- Payment completion
- Receipt information

### History

Displays completed parking sessions and payment information.

### Login

Provides user authentication.

### Signup

Allows new users to register.

### Profile

Displays user account information.

## 3D Parking Visualization

The project includes a 3D parking visualization using React Three Fiber and Three.js.

The visualization is designed to provide a simplified digital representation of a real parking facility.

The scene contains:

- Parking bays
- Parking lanes
- Entry area
- Exit area
- Parking level labels
- Slot numbers
- Vehicle models
- Lighting
- Shadows
- Interactive camera controls

Users can:

- Rotate the scene
- Zoom in and out
- Select parking slots
- View occupied parking slots
- View available parking slots
- Switch between P1, P2, and P3

## Vehicle Visualization

The 3D scene maps vehicle types to parking slot sizes.

```text
SMALL
   ↓
Motorcycle / Two-wheeler

MEDIUM
   ↓
Car

LARGE
   ↓
Truck / Heavy Vehicle
```

Vehicles are rendered only when the corresponding parking session occupies the slot.

## REST API

The Spring Boot backend provides REST APIs for communication with the React frontend.

Major API modules include:

```text
Authentication
      |
      +── Login
      +── Signup

Users
      |
      +── User Management

Vehicles
      |
      +── Vehicle CRUD

Parking Levels
      |
      +── Level Management

Parking Slots
      |
      +── Slot Management
      +── Availability
      +── Compatible Slot Search
      +── Slot Status

Parking Sessions
      |
      +── Check-in
      +── Active Session
      +── Checkout
      +── Fee Calculation

Reservations
      |
      +── Create Reservation
      +── View Reservation
      +── Cancel Reservation
```

## Database

The project uses MySQL as the relational database.

Spring Data JPA and Hibernate are used for database interaction.

### Main Database Entities

```text
User
  |
  +── Vehicle
  |
  +── ParkingSession
  |
  +── Reservation


ParkingLevel
  |
  +── ParkingSlot
        |
        +── ParkingSession
        |
        +── Reservation
```

## Main Database Tables

### users

Stores user account information and roles.

### vehicles

Stores registered vehicle information.

### parking_levels

Stores parking level information such as:

```text
P1
P2
P3
```

### parking_slots

Stores parking slot information including:

- Slot number
- Slot size
- Slot status
- Parking level

### parking_sessions

Stores:

- Vehicle
- Parking slot
- Check-in time
- Check-out time
- Parking duration
- Parking fee
- Payment information
- Session status

### reservations

Stores parking reservation information.

## Technology Stack

### Frontend

- React.js
- Vite
- JavaScript
- HTML5
- CSS3
- React Router
- Three.js
- React Three Fiber

### Backend

- Java 17
- Spring Boot
- Spring Boot Maven
- Spring Web
- Spring Data JPA
- Thymeleaf
- Lombok
- Spring Boot DevTools

### Database

- MySQL
- Hibernate
- JPA

### Development Tools

- Visual Studio Code
- MySQL
- Maven
- Git
- GitHub
- Postman
- Thunder Client

## Spring Boot Project Initialization

The backend is based on a Maven Spring Boot project with the following dependencies:

```bash
spring init --build=maven --dependencies=web,devtools,thymeleaf,mysql,lombok,data-jpa --package=app --name=backend backend
```

The project uses Java 17 as the Java version.

## Running the Project

### Prerequisites

Install the following:

- Java 17
- Maven
- Node.js
- npm
- MySQL
- Git

## Database Setup

Create a MySQL database:

```sql
CREATE DATABASE smart_parking;
```

Configure the database connection in:

```text
backend/src/main/resources/application.properties
```

Example:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/smart_parking
spring.datasource.username=root
spring.datasource.password=YOUR_PASSWORD

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true

server.port=4040
```

Replace:

```text
YOUR_PASSWORD
```

with the MySQL password configured on the local system.

## Running the Backend

Open a terminal and navigate to the backend:

```powershell
cd backend
```

Build the project:

```powershell
.\mvnw.cmd clean install -DskipTests
```

Start the Spring Boot application:

```powershell
.\mvnw.cmd spring-boot:run
```

Backend server:

```text
http://localhost:4040
```

## Running the Frontend

Open another terminal.

Navigate to:

```powershell
cd frontend/smartpark
```

Install dependencies:

```powershell
npm install
```

Start the Vite development server:

```powershell
npm run dev
```

Frontend server:

```text
http://localhost:5173
```

## Project Structure

```text
Smart-Parking/
│
├── backend/
│   ├── src/
│   ├── pom.xml
│   └── mvnw.cmd
│
├── frontend/
│   └── smartpark/
│       ├── src/
│       ├── public/
│       ├── package.json
│       └── vite.config.js
│
└── README.md
```

## Development Workflow

The application follows this development flow:

```text
Frontend
   |
   | HTTP Request
   v
REST Controller
   |
   v
Service Layer
   |
   v
Repository
   |
   v
MySQL
   |
   v
Repository
   |
   v
Service
   |
   v
Controller
   |
   | HTTP Response
   v
Frontend
```

## Project Validation

The project has been tested for:

- Frontend production build
- Backend compilation
- REST API communication
- Authentication
- Vehicle management
- Parking slot management
- Parking level management
- Parking availability
- Vehicle compatibility
- Check-in
- Active parking
- Checkout
- Payment validation
- Parking history
- Reservation functionality
- 3D parking slot rendering
- Parking slot selection
- Multi-level parking visualization

## Current Parking Facility

The application supports a multi-level parking facility containing:

```text
P1
P2
P3
```

with Small, Medium, and Large parking slots distributed across the levels.

The facility is designed so that the backend database remains the source of truth for parking availability and slot information.

## Future Enhancements

The system can be extended with:

- Online payment gateway integration
- QR-based parking entry
- QR-based parking exit
- Automatic number plate recognition
- IoT-based parking sensors
- Real-time occupancy sensors
- Camera-based vehicle detection
- Admin dashboard
- Parking analytics
- Revenue reports
- User notifications
- Email notifications
- Mobile application
- Cloud deployment
- Advanced role-based access control
- Digital parking receipts

## Project Objective

The primary objective of this project is to develop a practical full-stack parking management platform using:

```text
Java
Spring Boot
Maven
Spring Data JPA
MySQL
React
Vite
Three.js
```

The project focuses mainly on backend development using Spring Boot, REST API development, database management using MySQL, and integration with a modern React frontend.

## Conclusion

The Smart Parking & Vehicle Management Platform demonstrates the development of a complete full-stack web application for managing parking facilities and vehicles.

The project combines:

- Java
- Spring Boot
- Maven
- Spring Data JPA
- MySQL
- REST APIs
- React
- Vite
- Three.js

to provide a centralized parking management solution.

The application demonstrates practical concepts including layered backend architecture, entity relationships, CRUD operations, REST API development, authentication, database management, parking session management, payment processing, reservation handling, and interactive 3D visualization.
