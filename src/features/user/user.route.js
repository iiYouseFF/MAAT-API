import express from "express";
import * as UserController from "./user.controller.js";
import { protect } from "../auth/auth.middleware.js";

const router = express.Router();

router.put("/NID/:national_id", UserController.updateProfile);
router.get("/NID/:national_id", UserController.getProfile);
router.get("/ID/:user_id", UserController.GetUserById);
router.post("/ID/:user_id/add-balance", UserController.AddBalance);
router.get("/ID/:user_id/balance", UserController.GetBalance);

// Authenticated balance routes (use JWT user id)
router.post("/me/top-up", protect, UserController.TopUp);
router.get("/me/balance", protect, UserController.GetMyBalance);

export default router;
