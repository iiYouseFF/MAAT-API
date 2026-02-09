import express from "express";
import * as NfcController from "./nfc.controller.js";

const router = express.Router();

router.post("/", NfcController.registerCard);
router.get("/:card_uid", NfcController.getCard);
router.get("/user/:user_id", NfcController.getUserCards);

export default router;
