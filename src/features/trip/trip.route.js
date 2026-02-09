import express from "express";
import * as TripController from "./trip.controller.js";

const router = express.Router();

router.get("/history/:card_id", TripController.getTripHistoryByUserId);

export default router;
