import express from "express";
import * as AdminController from "./admin.controller.js";
import { protect, adminOnly } from "../auth/auth.middleware.js";

const router = express.Router();

// All admin routes require auth + admin/manager role
router.use(protect, adminOnly);

// Dashboard
router.get("/stats", AdminController.getStats);

// Users
router.get("/users", AdminController.getUsers);
router.post("/users", AdminController.createUser);
router.post("/users/:id/top-up", AdminController.topUpUser);

// NFC Tags
router.get("/cards", AdminController.getCards);
router.post("/nfc/register", AdminController.registerNfcTag);
router.get("/nfc/unpaired", AdminController.getUnpairedCards);

// Bookings
router.get("/bookings", AdminController.getAllBookings);

// Trips
router.get("/trips/recent", AdminController.getRecentTrips);
router.get("/trips/active", AdminController.getActiveTrips);
router.get("/trips", AdminController.getAllTrips);

// Stations & Scanners
router.get("/stations", AdminController.getStations);
router.get("/scanners", AdminController.getAllScanners);

export default router;
