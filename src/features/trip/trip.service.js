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

export async function SearchTrains(from, to, date, passengers = 1, ticketClass = "Economy") {
    // Get stations by name
    const { data: fromStation } = await supabase
        .from("stations")
        .select("*")
        .ilike("name", `%${from}%`)
        .limit(1)
        .single();

    const { data: toStation } = await supabase
        .from("stations")
        .select("*")
        .ilike("name", `%${to}%`)
        .limit(1)
        .single();

    if (!fromStation || !toStation) {
        throw new Error("Station not found");
    }

    // Calculate fare based on stations
    const baseFare = calculateFare(fromStation, toStation);

    // Apply class multiplier
    const classMultipliers = {
        "Luxury": 3.0,
        "Executive": 2.0,
        "Business": 1.5,
        "Economy": 1.0
    };

    const multiplier = classMultipliers[ticketClass] || 1.0;
    const totalFare = baseFare * multiplier * passengers;

    // Mock train schedules (in production, this would query a schedules table)
    const trains = [
        {
            id: 1,
            train_number: "T101",
            departure_time: "08:00",
            arrival_time: "12:30",
            duration: "4h 30m",
            available_seats: 120,
            fare: totalFare,
            class: ticketClass
        },
        {
            id: 2,
            train_number: "T203",
            departure_time: "14:00",
            arrival_time: "18:15",
            duration: "4h 15m",
            available_seats: 85,
            fare: totalFare,
            class: ticketClass
        },
        {
            id: 3,
            train_number: "T305",
            departure_time: "20:00",
            arrival_time: "00:45",
            duration: "4h 45m",
            available_seats: 150,
            fare: totalFare,
            class: ticketClass
        }
    ];

    return {
        from: fromStation,
        to: toStation,
        date,
        passengers,
        ticketClass,
        trains
    };
}
