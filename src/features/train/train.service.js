import supabase from "../../config/supabase.js";

/**
 * Get all train classes (Spanish, VIP, Russian, etc.)
 */
export async function GetAllClasses() {
    const { data, error } = await supabase
        .from("train_classes")
        .select("*")
        .order("id");

    if (error) throw error;
    return data;
}

/**
 * Get all trains, optionally filtered by class
 */
export async function GetAllTrains(classId) {
    let query = supabase
        .from("trains")
        .select("id, train_number, class_id, route_id, train_classes(name_ar, name_en)")
        .order("train_number");

    if (classId) {
        query = query.eq("class_id", classId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
}

/**
 * Get a single train with its full schedule
 */
export async function GetTrainSchedule(trainId) {
    const { data: train, error: trainErr } = await supabase
        .from("trains")
        .select("id, train_number, class_id, route_id, info, train_classes(name_ar, name_en)")
        .eq("id", trainId)
        .single();

    if (trainErr) throw trainErr;

    const { data: schedule, error: schErr } = await supabase
        .from("train_schedules")
        .select(`
            id,
            station_id,
            arrival_time,
            departure_time,
            arrival_minutes,
            departure_minutes,
            stop_order,
            note
        `)
        .eq("train_id", trainId)
        .order("stop_order");

    if (schErr) throw schErr;

    // Enrich schedule with station names
    const stationIds = schedule.map(s => s.station_id);
    const { data: stations } = await supabase
        .from("stations")
        .select("id, name_ar, name_en")
        .in("id", stationIds);

    const stationMap = new Map(stations?.map(s => [s.id, s]) || []);

    const enrichedSchedule = schedule.map(s => ({
        ...s,
        station: stationMap.get(s.station_id) || { name_ar: "غير معروف", name_en: "Unknown" }
    }));

    return {
        ...train,
        schedule: enrichedSchedule
    };
}

/**
 * Get trains by route (section)
 */
export async function GetTrainsByRoute(routeId) {
    const { data, error } = await supabase
        .from("trains")
        .select("id, train_number, class_id, train_classes(name_ar, name_en)")
        .eq("route_id", routeId)
        .order("train_number");

    if (error) throw error;
    return data;
}
