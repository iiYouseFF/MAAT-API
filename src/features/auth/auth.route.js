import express from "express";
import * as AuthController from "./auth.controller.js";
import { protect } from "./auth.middleware.js";

const router = express.Router();

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/verify", AuthController.verifyOTP);
router.get("/me", protect, AuthController.getMe);

export default router;
