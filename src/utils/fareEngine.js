import supabase from "../config/supabase.js";

export async function calculateFare(fromId, toId) {
    let fare;
    const {data: recentFare} = await supabase
        .from("fares")
        .select("*")
        .eq("from_station_id", fromId)
        .eq("to_station_id", toId)
        .single();

    if (recentFare) {
        fare = recentFare.price;
    }

    const {data: reverseFare} = await supabase
        .from("fares")
        .select("*")
        .eq("from_station_id", toId)
        .eq("to_station_id", fromId)
        .single();

    if (reverseFare) {
        fare = reverseFare.price;
    }

    if (!fare) {
        const CalculatedFare = ((Math.abs(fromId - toId) / 100) * 10);
        fare = CalculatedFare;
    }

    return fare;
}