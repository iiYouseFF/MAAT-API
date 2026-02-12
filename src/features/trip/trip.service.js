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

    const { data: activeTrip } = await supabase
        .from("trips")
        .select("*")
        .eq("user_id", user_id)
        .eq("status", "active")
        .single();

    if (!activeTrip) throw new Error("No active trip found for this user");

    const { data: exitStation } = await supabase.from("stations").select("*").eq("id", station_id).single();

    const fare = await calculateFare(activeTrip.entry_station_id, station_id);

    const { data: user } = await supabase.from("users").select("balance").eq("id", user_id).single();
    const newBalance = parseFloat(user.balance) - fare;

    await supabase.from("users").update({ balance: newBalance }).eq("id", user_id);

    const { data: updatedTrip, error } = await supabase.from("trips").update({
        exit_station_id: station_id,
        exit_time: new Date().toISOString(),
        fare,
        status: "completed"
    }).eq("id", activeTrip.id).select().single();

    if (error) throw error;

    return {
        trip: updatedTrip,
        fare_deducted: fare,
        new_balance: newBalance,
        trip_duration_minutes: Math.round((new Date() - new Date(activeTrip.entry_time)) / 60000)
    };
}

/**
 * Search for real trains between two stations.
 * Finds trains whose schedules include both the origin and destination
 * stations in the correct order (departure before arrival).
 */
export async function SearchTrains(from, to, date, passengers = 1, ticketClass) {
    // 1. Resolve station names to IDs (bilingual search)
    const { data: fromStations } = await supabase
        .from("stations")
        .select("id, name, name_ar, name_en")
        .eq("is_active", true)
        .or(`name_ar.ilike.%${from}%,name_en.ilike.%${from}%`)
        .limit(1);

    const { data: toStations } = await supabase
        .from("stations")
        .select("id, name, name_ar, name_en")
        .eq("is_active", true)
        .or(`name_ar.ilike.%${to}%,name_en.ilike.%${to}%`)
        .limit(1);

    if (!fromStations?.length || !toStations?.length) {
        throw new Error("Station not found");
    }

    const fromStation = fromStations[0];
    const toStation = toStations[0];

    // 2. Find trains that stop at the origin station
    const { data: fromSchedules } = await supabase
        .from("train_schedules")
        .select("train_id, departure_time, departure_minutes, stop_order")
        .eq("station_id", fromStation.id);

    if (!fromSchedules?.length) {
        return { from: fromStation, to: toStation, date, passengers, trains: [] };
    }

    const trainIds = [...new Set(fromSchedules.map(s => s.train_id))];

    // 3. Find which of those trains also stop at the destination
    const { data: toSchedules } = await supabase
        .from("train_schedules")
        .select("train_id, arrival_time, arrival_minutes, stop_order")
        .eq("station_id", toStation.id)
        .in("train_id", trainIds);

    if (!toSchedules?.length) {
        return { from: fromStation, to: toStation, date, passengers, trains: [] };
    }

    // 4. Match trains: origin stop_order must be before destination stop_order
    const toMap = new Map(toSchedules.map(s => [s.train_id, s]));

    const matchedTrainIds = [];
    const scheduleInfo = new Map();

    for (const fromSch of fromSchedules) {
        const toSch = toMap.get(fromSch.train_id);
        if (toSch && fromSch.stop_order < toSch.stop_order) {
            matchedTrainIds.push(fromSch.train_id);
            scheduleInfo.set(fromSch.train_id, {
                departure_time: fromSch.departure_time,
                departure_minutes: fromSch.departure_minutes,
                arrival_time: toSch.arrival_time,
                arrival_minutes: toSch.arrival_minutes,
            });
        }
    }

    if (!matchedTrainIds.length) {
        return { from: fromStation, to: toStation, date, passengers, trains: [] };
    }

    // 5. Get train details with class info
    const { data: trains } = await supabase
        .from("trains")
        .select("id, train_number, class_id, route_id, train_classes(name_ar, name_en)")
        .in("id", matchedTrainIds);

    // 6. Optionally filter by class (soft filter — if no match, show all)
    let filteredTrains = trains || [];
    if (ticketClass && ticketClass !== "all") {
        const classFiltered = filteredTrains.filter(t =>
            t.train_classes?.name_en?.toLowerCase().includes(ticketClass.toLowerCase()) ||
            t.train_classes?.name_ar?.includes(ticketClass)
        );
        // Only apply filter if it actually matches something
        if (classFiltered.length > 0) {
            filteredTrains = classFiltered;
        }
    }

    // 7. Calculate fare for this route
    const fare = await calculateFare(fromStation.id, toStation.id);

    // 8. Build response
    const results = filteredTrains.map(train => {
        const sch = scheduleInfo.get(train.id);
        const durationMinutes = sch
            ? ((sch.arrival_minutes - sch.departure_minutes + 1440) % 1440)
            : null;

        const hours = durationMinutes ? Math.floor(durationMinutes / 60) : null;
        const mins = durationMinutes ? durationMinutes % 60 : null;

        return {
            id: train.id,
            train_number: train.train_number,
            class: train.train_classes || { name_en: "Unknown", name_ar: "غير معروف" },
            departure_time: sch?.departure_time,
            arrival_time: sch?.arrival_time,
            duration: hours !== null ? `${hours}h ${mins}m` : null,
            duration_minutes: durationMinutes,
            fare_per_passenger: fare,
            total_fare: fare * passengers,
        };
    });

    // Sort by departure time
    results.sort((a, b) => {
        const aMin = scheduleInfo.get(a.id)?.departure_minutes ?? 9999;
        const bMin = scheduleInfo.get(b.id)?.departure_minutes ?? 9999;
        return aMin - bMin;
    });

    return {
        from: fromStation,
        to: toStation,
        date,
        passengers,
        ticketClass: ticketClass || "all",
        trains: results
    };
}
