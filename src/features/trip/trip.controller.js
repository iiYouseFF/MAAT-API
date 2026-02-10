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

export async function searchTrains(req, res) {
    try {
        const { from, to, date, passengers, ticketClass } = req.body;
        const results = await TripService.SearchTrains(from, to, date, passengers, ticketClass);
        res.status(200).json({ results });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function searchStations(req, res) {
    try {
        const { query } = req.query;

        if (!query || query.trim().length === 0) {
            return res.status(200).json({ stations: [] });
        }

        const { data, error } = await supabase
            .from("stations")
            .select("id, name, code, zone")
            .ilike("name", `%${query}%`)
            .eq("is_active", true)
            .limit(10);

        if (error) throw error;

        res.status(200).json({ stations: data || [] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
