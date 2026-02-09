import supabase from "../../config/supabase.js";
import { calculateFare } from "../../utils/fareEngine.js";

export async function handleEntry(card_uid, station_id) {

    const { data: card } = await supabase.from("nfc_cards").select("user_id").eq("card_uid", card_uid).single();
    if (!card) throw new Error("Card not found");
    const user_id = card.user_id;
    
    const { data: activeTrip } = await supabase
        .from("trips")
        .select("*")
        .eq("user_id", user_id)
        .eq("status", "active")
        .maybeSingle();

    if (activeTrip) {
        throw new Error("User already has an active trip");
    }


    const { data: user } = await supabase.from("users").select("balance").eq("id", user_id).single();
    const { data: station } = await supabase.from("stations").select("base_fare").eq("id", station_id).single();
    
    if (parseFloat(user.balance) < parseFloat(station.base_fare)) {
        throw new Error("Insufficient balance for entry");
    }

    // 3. Create trip
    const { data: trip, error } = await supabase.from("trips").insert({
        user_id,
        card_uid,
        entry_station_id: station_id,
        entry_time: new Date().toISOString(),
        status: "active"
    }).select().single();

    if (error) throw error;
    return { trip, user_balance: user.balance };
}

export async function handleExit(card_uid, station_id) {
    const { data: card } = await supabase.from("nfc_cards").select("user_id").eq("card_uid", card_uid).single();
    if (!card) throw new Error("Card not found");
    const user_id = card.user_id;
    // 1. Find active trip
    const { data: trip } = await supabase
        .from("trips")
        .select("*, entry_station:stations!entry_station_id(*)")
        .eq("user_id", user_id)
        .eq("status", "active")
        .single();

    if (!trip) throw new Error("No active trip found for this user");

    // 2. Get exit station details
    const { data: exitStation } = await supabase.from("stations").select("*").eq("id", station_id).single();

    // 3. Calculate fare
    const fare = calculateFare(trip.entry_station, exitStation);

    // 4. Update balance
    const { data: user } = await supabase.from("users").select("balance").eq("id", user_id).single();
    const newBalance = parseFloat(user.balance) - fare;

    await supabase.from("users").update({ balance: newBalance }).eq("id", user_id);

    // 5. Complete trip
    const { data: updatedTrip, error } = await supabase.from("trips").update({
        exit_station_id: station_id,
        exit_time: new Date().toISOString(),
        fare,
        status: "completed"
    }).eq("id", trip.id).select().single();

    if (error) throw error;

    return { 
        trip: updatedTrip, 
        fare_deducted: fare, 
        new_balance: newBalance,
        trip_duration_minutes: Math.round((new Date() - new Date(trip.entry_time)) / 60000)
    };
}
