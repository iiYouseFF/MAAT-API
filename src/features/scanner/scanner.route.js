import express from "express";
import * as ScannerController from "./scanner.controller.js";

const router = express.Router();

// Unified scan endpoint that handles entry, exit, and registration based on scanner type
router.post("/scan", ScannerController.handleTrip);
router.post("/register", ScannerController.registerScanner);

export default router;
