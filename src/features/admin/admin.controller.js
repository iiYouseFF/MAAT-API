import * as AdminService from "./admin.service.js";

export async function getStats(req, res) {
    try {
        const stats = await AdminService.GetDashboardStats();
        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function getRecentTrips(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const result = await AdminService.GetRecentTrips(page, limit);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function getActiveTrips(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const result = await AdminService.GetActiveTrips(page, limit);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function getUsers(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const result = await AdminService.GetUsers(page, limit);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function getStations(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const result = await AdminService.GetStations(page, limit);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function getCards(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const result = await AdminService.GetCards(page, limit);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function getAllTrips(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const result = await AdminService.GetTrips(page, limit);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function getAllScanners(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const result = await AdminService.GetScanners(page, limit);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// ========== NEW ADMIN ACTIONS ==========

export async function createUser(req, res) {
    try {
        const { national_id, full_name, email, phone, gender, card_uid } = req.body;

        if (!national_id || !full_name) {
            return res.status(400).json({ error: "national_id and full_name are required" });
        }

        const user = await AdminService.CreateUser({ national_id, full_name, email, phone, gender, card_uid });
        res.status(201).json({ message: "User created successfully", user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function topUpUser(req, res) {
    try {
        const { id } = req.params;
        const { amount, payment_method } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: "Invalid amount" });
        }
        if (!payment_method) {
            return res.status(400).json({ error: "Payment method is required (cash, vodafone, card, etc.)" });
        }

        const result = await AdminService.TopUpUser(id, amount, payment_method, req.user.id);
        res.status(200).json({ message: "Balance topped up successfully", ...result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function registerNfcTag(req, res) {
    try {
        const { card_uid } = req.body;

        if (!card_uid) {
            return res.status(400).json({ error: "card_uid is required" });
        }

        const card = await AdminService.RegisterNfcTag(card_uid, req.user.id);
        res.status(201).json({ message: "NFC tag registered", card });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function getUnpairedCards(req, res) {
    try {
        const mine = req.query.mine === "true";
        const cards = await AdminService.GetUnpairedCards(mine ? req.user.id : null);
        res.status(200).json({ cards });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function getAllBookings(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const result = await AdminService.GetAllBookings(page, limit);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
