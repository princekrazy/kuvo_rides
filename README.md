# Uber Clone Frontend

## Overview

This project is a modern ride-hailing frontend built with React and MapLibre GL. It provides separate experiences for riders and drivers while maintaining real-time synchronization throughout the ride lifecycle.

The application demonstrates real-time mapping, route visualization, persistent ride state management, authentication flows, and payment integration.

---

## Why MapLibre?

Instead of using proprietary mapping solutions, this project uses MapLibre GL.

Benefits:

* Fully open source
* No vendor lock-in
* High-performance vector rendering
* Active community support
* Suitable for production-scale mapping applications

Package used:

```javascript
import maplibregl from "maplibre-gl";
```

---

## Rider Experience

### Authentication

Riders can:

* Register
* Login
* Persist sessions

### Ride Request Flow

1. Rider logs in
2. Current location is automatically detected
3. Location permission is requested
4. Rider selects destination on map
5. Route is calculated and displayed
6. Estimated travel time is shown
7. Ride price is calculated
8. Ride request is submitted

### Driver Matching

After requesting a ride:

* Rider enters a waiting screen
* Available drivers receive the request
* Once accepted, rider is automatically redirected

### Live Driver Tracking

When a driver accepts:

* Driver information is displayed
* Driver marker appears on the map
* Marker updates continuously in real time
* Rider can monitor driver approach

This creates an experience similar to commercial ride-hailing platforms.

### Ride Completion

When the driver completes the trip:

* Rider receives completion notification
* Application resets ride state
* Rider can request another ride

---

## Driver Experience

### Authentication

Drivers can:

* Register
* Login
* Update profile information

### Ride Discovery

Drivers receive available ride requests.

Before accepting a request they can preview:

* Rider pickup route
* Rider destination route
* Distance information
* Ride details

### Ride Acceptance

After accepting:

* Driver becomes assigned to that ride
* Additional ride requests are blocked
* Live location sharing begins

### Ride Completion

Upon completion:

* Ride status is finalized
* Commission is deducted
* Wallet balance is updated

### Driver Wallet Logic

Drivers begin with a wallet balance of:

```text
20
```

If balance drops below zero:

* Driver is prevented from accepting rides
* Warning messages are displayed
* Balance must be restored before continuing

---

## Persistent Ride State

One challenge in ride-hailing systems is accidental page refreshes or application closures.

To solve this, the application uses Local Storage to preserve ride state.

Benefits:

* Users can continue active rides after reopening
* Prevents duplicate ride requests
* Prevents multiple ride acceptances
* Improves reliability during network interruptions

Examples of persisted state:

* Active ride
* Ride status
* Driver assignment
* Rider assignment

---

## Real-Time Features

### Live Driver Location Updates

Driver coordinates are continuously transmitted to the backend.

The frontend listens for updates and:

* Updates driver markers instantly
* Animates movement across the map
* Keeps rider and driver views synchronized

### Route Visualization

The application dynamically renders:

* Pickup routes
* Destination routes
* Driver-to-rider routes

Providing users with complete visibility throughout the ride process.

---

## Tech Stack

* React
* JavaScript
* MapLibre GL
* Local Storage
* REST APIs
* WebSockets
* PayPal Integration

---

## Key Challenges Solved

### Real-Time Synchronization

Maintaining accurate driver movement while minimizing delays.

### Session Recovery

Recovering ride state after refreshes or accidental exits.

### Ride Integrity

Ensuring:

* Riders cannot create multiple active rides
* Drivers cannot accept multiple rides

### Geolocation Handling

Managing:

* Browser location permissions
* GPS updates
* Route calculations
* Dynamic map rendering

---

## Skills Demonstrated

* React Development
* Real-Time Applications
* Mapping Technologies
* Geolocation Services
* State Persistence
* WebSocket Integration
* Payment Integration
* UX Flow Design
* Frontend Architecture

---
## Live Demo

**Frontend Application**

🚀 Live Demo: https://princekrazy.github.io/kuvo_rides/

**Backend API**

🔗 API Base URL: https://kuvo-api.onrender.com/api

### Test Credentials

You may optionally provide demo rider and driver accounts so recruiters can experience the complete ride workflow without creating accounts.

### What Recruiters Can Test

#### Rider Flow

1. Register or log in
2. Allow location access
3. Select a destination on the map
4. View route, ETA, and fare estimate
5. Request a ride
6. Wait for driver acceptance
7. Track the driver's live location in real time
8. Receive ride completion notification

#### Driver Flow

1. Register or log in
2. Browse incoming ride requests
3. Preview pickup and destination routes
4. Accept a ride request
5. Share live location updates
6. Complete the ride
7. View wallet balance updates and commission deductions

### Note

The application uses real-time location synchronization. For the best experience, test the rider and driver flows simultaneously using separate browser windows or devices.

