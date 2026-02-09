import * as NfcService from "./nfc.service.js";

export async function registerCard(req, res) {
    try {
        const { card_uid, user_id, registered_by } = req.body;
        const card = await NfcService.RegisterCard(card_uid, user_id, registered_by);
        res.status(201).json({ message: "Card registered successfully", card });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function getCard(req, res) {
    try {
        const { card_uid } = req.params;
        const card = await NfcService.GetCard(card_uid);
        if (!card) {
            return res.status(404).json({ error: "Card not found" });
        }
        res.status(200).json({ card });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function getUserCards(req, res) {
    try {
        const { user_id } = req.params;
        const cards = await NfcService.GetUserCards(user_id);
        res.status(200).json({ cards });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
