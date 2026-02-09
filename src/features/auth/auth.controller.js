import * as AuthService from "./auth.service.js";

export async function register(req, res) {
    try {
        const { national_id, full_name, phoneNumber, gender, email, cardId } = req.body;
        const result = await AuthService.SignUp(national_id, full_name, phoneNumber, gender, email, cardId);
        res.status(201).json({ 
            message: "User registered successfully", 
            user: result.user,
            card: result.card,
            token: result.token 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function login(req, res) {
    try {
        const { national_id } = req.body;
        const user = await AuthService.SendOTP(national_id);
        res.status(200).json({ message: "OTP sent successfully", user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function verifyOTP(req, res) {
    try {
        const { national_id, otp } = req.body;
        if (!national_id || !otp) {
            return res.status(400).json({ error: "National ID and OTP are required" });
        }

        const verification = await AuthService.VerifyOTP(national_id, otp);

        if (verification.status === "approved") {
            res.status(200).json({ 
                message: "Login successful", 
                user: verification.user,
                token: verification.token 
            });
        } else {
            res.status(401).json({ error: "Invalid OTP" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function getMe(req, res) {
    try {
        res.status(200).json({ user: req.user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
