import supabase from "../../config/supabase.js";
import * as TripService from "./trip.service.js";

export async function getTripHistoryByUserId(req, res) {
    try {
        const { card_id } = req.params;
        const { data, error } = await supabase.from("trips").select("*").eq("card_uid", card_id);
        if (error) throw error;
        res.status(200).json({ trips: data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
