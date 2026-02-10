import express from "express";
import * as TrainController from "./train.controller.js";

const router = express.Router();

router.get("/classes", TrainController.getAllClasses);
router.get("/", TrainController.getAllTrains);
router.get("/:id/schedule", TrainController.getTrainSchedule);
router.get("/route/:route_id", TrainController.getTrainsByRoute);

export default router;
