import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";

import UserRouter from "./features/user/user.route.js";
import NfcRouter from "./features/nfc/nfc.route.js";
import AuthRouter from "./features/auth/auth.route.js";
import StationRouter from "./features/station/station.route.js";
import ScannerRouter from "./features/scanner/scanner.route.js";
import TripRouter from "./features/trip/trip.route.js";
import AdminRouter from "./features/admin/admin.route.js";

const app = express();

// --- Production Middleware ---
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(compression()); // Compress responses
app.use(morgan("combined")); // Standard production logging
app.use(express.json());

// Rate Limiting: 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests from this IP, please try again later." },
});
app.use("/api/", limiter);

// --- Health Check ---
app.get("/health", (req, res) => {
  res.status(200).json({ status: "up", timestamp: new Date().toISOString() });
});

// --- Routes ---
app.use("/api/v1/users", UserRouter);
app.use("/api/v1/nfc", NfcRouter);
app.use("/api/v1/auth", AuthRouter);
app.use("/api/v1/stations", StationRouter);
app.use("/api/v1/scanners", ScannerRouter);
app.use("/api/v1/trips", TripRouter);
app.use("/api/v1/admin", AdminRouter);

// --- Global Error Handling ---
app.use((err, req, res, next) => {
  console.error(`[Error] ${err.stack}`);
  const status = err.status || 500;
  res.status(status).json({
    error: process.env.NODE_ENV === "production" ? "Internal Server Error" : err.message,
  });
});

export default app;