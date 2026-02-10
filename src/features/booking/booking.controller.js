import * as BookingService from "./booking.service.js";

export async function createBooking(req, res) {
    try {
        const userId = req.user.id; // From auth middleware
        const { trainId, passengers, searchParams } = req.body;

        if (!trainId || !passengers) {
            return res.status(400).json({ error: "Train ID and passengers are required" });
        }

        const booking = await BookingService.createBooking(userId, trainId, passengers, searchParams);
        res.status(201).json({ booking });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function getUserBookings(req, res) {
    try {
        const userId = req.user.id;
        const bookings = await BookingService.getUserBookings(userId);
        res.status(200).json({ bookings });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function getBookingById(req, res) {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const booking = await BookingService.getBookingById(id, userId);
        res.status(200).json({ booking });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function cancelBooking(req, res) {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const result = await BookingService.cancelBooking(id, userId);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
