import express from "express";
import * as BookingController from "./booking.controller.js";
import { protect } from "../auth/auth.middleware.js";

const router = express.Router();

// All booking routes require authentication
router.post("/", protect, BookingController.createBooking);
router.get("/", protect, BookingController.getUserBookings);
router.get("/:id", protect, BookingController.getBookingById);
router.delete("/:id", protect, BookingController.cancelBooking);

export default router;
