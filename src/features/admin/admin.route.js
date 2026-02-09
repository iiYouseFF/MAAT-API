import express from "express";
import * as AdminController from "./admin.controller.js";

const router = express.Router();

router.get("/stats", AdminController.getStats);
router.get("/trips/recent", AdminController.getRecentTrips);
router.get("/trips/active", AdminController.getActiveTrips);
router.get("/users", AdminController.getUsers);
router.get("/stations", AdminController.getStations);
router.get("/cards", AdminController.getCards);
router.get("/trips", AdminController.getAllTrips);
router.get("/scanners", AdminController.getAllScanners);

export default router;
