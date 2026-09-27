\# Smart Parking \& Vehicle Management Platform



A full-stack Smart Parking and Vehicle Management Platform designed to simplify parking operations through digital parking-slot management, vehicle tracking, live parking status, checkout and payment processing, parking history, and an interactive 3D parking visualization.



The system provides a centralized platform for managing parking levels, parking slots, vehicles, users, active parking sessions, reservations, and parking payments.



\---



\## 📌 Project Overview



Managing parking spaces manually can make it difficult to track available slots, parked vehicles, parking duration, and parking charges.



The Smart Parking \& Vehicle Management Platform addresses these challenges by providing a web-based system where users can:



\- Register and log in

\- Manage their vehicles

\- View parking levels and available slots

\- Select parking slots based on vehicle type

\- Check vehicles in

\- Track active parking sessions

\- View live parking duration and estimated fees

\- Check out and complete payment

\- View parking history

\- View parking status through an interactive 3D parking layout



The platform also provides backend APIs for managing parking levels, slots, vehicles, users, reservations, and parking sessions.



\---



\## 🚀 Features



\### User Management

\- User registration and login

\- User profile management

\- User role management

\- Authentication and authorization

\- User-specific active parking sessions



\### Vehicle Management

\- Add vehicles

\- Update vehicle information

\- Delete vehicles

\- View registered vehicles

\- Vehicle type validation

\- Vehicle-to-parking-slot compatibility



\### Parking Level Management

\- Multiple parking levels

\- Level-wise parking capacity

\- Level-wise occupied and available slot counts

\- Parking level selection

\- Dynamic parking availability



\### Parking Slot Management

\- SMALL slots for two-wheelers

\- MEDIUM slots for cars

\- LARGE slots for heavy vehicles

\- Slot availability tracking

\- Occupied / Available / Reserved / Out-of-Service states

\- Vehicle-compatible slot selection



\### Parking Session Management

\- Vehicle check-in

\- Active parking session tracking

\- Check-in timestamp

\- Parking duration calculation

\- Estimated parking fee

\- Vehicle check-out

\- Automatic slot release after checkout



\### Payment \& Checkout

\- Checkout flow with payment selection

\- UPI payment simulation

\- Card payment simulation

\- Cash payment option

\- Payment validation

\- Payment reference generation

\- Payment status tracking

\- Checkout receipt

\- Paid timestamp

\- Payment history



\### Parking History

\- Completed parking sessions

\- Vehicle details

\- Parking level

\- Parking slot

\- Check-in time

\- Check-out time

\- Parking duration

\- Parking rate

\- Parking fee

\- Payment method

\- Payment status

\- Payment reference



\### Reservation

\- Parking reservation backend support

\- Reservation creation

\- Reservation management

\- Reservation status tracking



\### Interactive 3D Parking Visualization

\- Interactive 3D parking layout

\- Multiple parking levels

\- Visual parking-slot states

\- Available slots

\- Occupied slots

\- Selected slots

\- User's active slot

\- Reserved slots

\- Out-of-service slots

\- Vehicle visualization inside occupied slots

\- Orbit and zoom interaction



\---



\## 🛠️ Technology Stack



\### Frontend

\- React

\- Vite

\- JavaScript

\- HTML5

\- CSS3

\- React Three Fiber / Three.js

\- Local Storage



\### Backend

\- Java 17

\- Spring Boot

\- Spring Boot Maven

\- Spring Web

\- Spring Data JPA

\- Thymeleaf

\- Lombok

\- Spring DevTools



\### Database

\- MySQL



\### Development Tools

\- Visual Studio Code

\- IntelliJ IDEA / Spring Tooling

\- MySQL

\- Git

\- GitHub

\- Postman / Thunder Client



\---



\## 🏗️ System Architecture



```text

&#x20;                  ┌─────────────────────┐

&#x20;                  │      User           │

&#x20;                  └──────────┬──────────┘

&#x20;                             │

&#x20;                             ▼

&#x20;                  ┌─────────────────────┐

&#x20;                  │   React Frontend   │

&#x20;                  │      + Vite         │

&#x20;                  └──────────┬──────────┘

&#x20;                             │

&#x20;                        REST APIs

&#x20;                             │

&#x20;                             ▼

&#x20;                  ┌─────────────────────┐

&#x20;                  │   Spring Boot      │

&#x20;                  │      Backend        │

&#x20;                  └──────────┬──────────┘

&#x20;                             │

&#x20;             ┌───────────────┼────────────────┐

&#x20;             │               │                │

&#x20;             ▼               ▼                ▼

&#x20;      ┌────────────┐  ┌────────────┐  ┌────────────┐

&#x20;      │ Controllers│  │  Services  │  │Repositories│

&#x20;      └────────────┘  └────────────┘  └─────┬──────┘

&#x20;                                             │

&#x20;                                             ▼

&#x20;                                     ┌──────────────┐

&#x20;                                     │    MySQL     │

&#x20;                                     │   Database   │

&#x20;                                     └──────────────┘

