import jwt from "jsonwebtoken";
import supabase from "../../config/supabase.js";
import dotenv from "dotenv";
dotenv.config();

export const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            // Get token from header
            token = req.headers.authorization.split(" ")[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from database
            const { data: user, error } = await supabase
                .from("users")
                .select("*")
                .eq("id", decoded.id)
                .single();

            if (error || !user) {
                return res.status(401).json({ error: "Not authorized, user not found" });
            }

            req.user = user;
            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ error: "Not authorized, token failed" });
        }
    }

    if (!token) {
        res.status(401).json({ error: "Not authorized, no token" });
    }
};
