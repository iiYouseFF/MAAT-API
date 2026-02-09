import express from "express";
import * as StationController from "./station.controller.js";

const router = express.Router();

router.get("/", StationController.getAllStations);
router.post("/", StationController.createStation);

export default router;
