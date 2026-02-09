# MAAT API - Smart Metro System

MAAT API is a robust, scalable backend system designed to power a modern Smart Metro System. It handles user authentication, NFC card management, real-time trip tracking, and dynamic fare calculation.

---

## 🚀 Key Features

- **🔐 Advanced Authentication**: Secure login flow using National ID and virtual OTP (One-Time Password) for effortless prototyping.
- **💳 NFC Card Management**: Complete lifecycle management for transit cards, including registration and user linking.
- **🚆 Real-time Trip Tracking**: Seamless entry and exit scanning logic with automatic trip state management.
- **💰 Dynamic Fare Engine**: Advanced fare calculation based on station zones, peak hours, and user types (Regular/Student/Senior).
- **📡 Hardware Integration**: Dedicated endpoints for scanner devices to simulate hardware interactions at metro gates.

---

## 🛠 Tech Stack

- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL + Auth)
- **Real-time Logging**: [Nodemon](https://nodemon.io/) for development
- **Testing**: REST Client (`endpoints.http`) for in-IDE API testing

---

## 📁 Project Structure

```text
MAAT API/
├── src/
│   ├── features/         # Modular feature-based architecture
│   │   ├── admin/        # System Monitoring Dashboard
│   │   │   ├── admin.controller.js
│   │   │   ├── admin.route.js
│   │   │   └── admin.service.js
│   │   ├── auth/         # JWT-based Auth & Onboarding
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.middleware.js
│   │   │   ├── auth.route.js
│   │   │   └── auth.service.js
│   │   ├── nfc/   
        # Card Registry & Lookup
│   │   ├── scanner/      # Unified Hardware Interaction
│   │   ├── station/      # Station Registry
│   │   ├── trip/         # Core Billing & Tracking Logic
│   │   └── user/         # User Profiles & Balance
│   ├── utils/            # Shared logic (Fare Engine)
│   ├── config/           # Database & Env config
│   ├── app.js            # Express routing
│   ├── server.js         # HTTP Server setup
│   └── index.js          # Entry point
├── endpoints.http        # Comprehensive API Testing Suite
├── package.json          # Dependencies
└── README.md
```

---

## 🚦 Getting Started

### Prerequisites

- Node.js (v16+)
- npm

### Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in a `.env` file (see `.env.example` if available).

### Running the Server

```bash
# Development mode with nodemon
npm start
```

---

## 🔌 API Reference

### 🔐 Authentication (`/api/v1/auth`)

| Method | Endpoint    | Description                      | Auth |
| :----- | :---------- | :------------------------------- | :--- |
| `POST` | `/register` | Register new user & NFC card     | ❌   |
| `POST` | `/login`    | Send virtual OTP to phone        | ❌   |
| `POST` | `/verify`   | Verify OTP & receive JWT token   | ❌   |
| `GET`  | `/me`       | Get currently authenticated user | ✅   |

### 👤 User Management (`/api/v1/users`)

| Method | Endpoint               | Description                   | Auth |
| :----- | :--------------------- | :---------------------------- | :--- |
| `GET`  | `/NID/:nid`            | Get profile by National ID    | ✅   |
| `PUT`  | `/NID/:nid`            | Update profile by National ID | ✅   |
| `GET`  | `/ID/:uid`             | Get profile by User UUID      | ✅   |
| `GET`  | `/ID/:uid/balance`     | Get current balance           | ✅   |
| `POST` | `/ID/:uid/add-balance` | Add funds to account balance  | ✅   |

### 💳 NFC Card Management (`/api/v1/nfc`)

| Method | Endpoint     | Description                     | Auth |
| :----- | :----------- | :------------------------------ | :--- |
| `POST` | `/`          | Register or link a new NFC card | ❌   |
| `GET`  | `/:card_uid` | Get details of a specific card  | ❌   |
| `GET`  | `/user/:uid` | Get all cards linked to a user  | ❌   |

### 🚆 Station & Trip Management

| Method | Endpoint                          | Description                  |
| :----- | :-------------------------------- | :--------------------------- |
| `GET`  | `/api/v1/stations`                | List all metro stations      |
| `POST` | `/api/v1/stations`                | Create a new station (Admin) |
| `GET`  | `/api/v1/trips/history/:card_uid` | View trip history for a card |

### 📟 Hardware Scanner Simulation (`/api/v1/scanners`)

| Method | Endpoint    | Description                               |
| :----- | :---------- | :---------------------------------------- |
| `POST` | `/register` | Register a hardware scanner device        |
| `POST` | `/scan`     | Process an NFC scan (Entry/Exit/Register) |

### 📊 Admin Dashboard (`/api/v1/admin`)

_Supports pagination via `?page=1&limit=20`_
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/stats` | System-wide statistics & revenue |
| `GET` | `/trips/recent` | Real-time list of all recent trips |
| `GET` | `/trips/active` | Current ongoing trips in system |
| `GET` | `/scanners` | Device status and health monitor |
| `GET` | `/users` | Global user directory |

---

---

## 🧪 Testing the API

The project includes an `endpoints.http` file compatible with the **REST Client** extension for VS Code. This file contains curated scenarios to test the entire system flow:

1. User Registration & Profile Setup
2. National ID Login & OTP Verification
3. Station Management and Card Registration
4. Hardware Simulation (Scan Entry → Scan Exit)
5. Trip History Retrieval

---

## 🛡 License

This project is private and intended for the Smart Metro System development team.
