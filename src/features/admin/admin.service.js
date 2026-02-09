import supabase from "../../config/supabase.js";

const getPagination = (page, limit) => {
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    return { from, to };
};

export async function GetDashboardStats() {
    const { count: usersCount } = await supabase.from("users").select("*", { count: 'exact', head: true });
    const { count: activeTripsCount } = await supabase.from("trips").select("*", { count: 'exact', head: true }).eq("status", "active");
    const { count: cardsCount } = await supabase.from("nfc_cards").select("*", { count: 'exact', head: true });
    
    const { data: revenueData } = await supabase.from("trips").select("fare").not("fare", "is", null);
    const totalRevenue = revenueData?.reduce((acc, curr) => acc + (parseFloat(curr.fare) || 0), 0) || 0;

    return {
        users: usersCount || 0,
        active_trips: activeTripsCount || 0,
        registered_cards: cardsCount || 0,
        total_revenue: totalRevenue
    };
}

export async function GetRecentTrips(page = 1, limit = 20) {
    const { from, to } = getPagination(page, limit);
    const { data, error, count } = await supabase
        .from("trips")
        .select(`
            *,
            user:users!user_id(full_name, national_id),
            entry_station:stations!entry_station_id(name),
            exit_station:stations!exit_station_id(name)
        `, { count: 'exact' })
        .order("entry_time", { ascending: false })
        .range(from, to);

    if (error) throw error;
    return { trips: data, total: count, page, limit };
}

export async function GetActiveTrips(page = 1, limit = 20) {
    const { from, to } = getPagination(page, limit);
    const { data, error, count } = await supabase
        .from("trips")
        .select(`
            *,
            user:users!user_id(full_name, national_id),
            entry_station:stations!entry_station_id(name)
        `, { count: 'exact' })
        .eq("status", "active")
        .order("entry_time", { ascending: false })
        .range(from, to);

    if (error) throw error;
    return { trips: data, total: count, page, limit };
}

export async function GetScannerStatuses(page = 1, limit = 20) {
    const { from, to } = getPagination(page, limit);
    const { data, error, count } = await supabase
        .from("scanner_devices")
        .select(`
            *,
            station:stations!station_id(name)
        `, { count: 'exact' })
        .order("last_heartbeat", { ascending: false })
        .range(from, to);

    if (error) throw error;
    return { scanners: data, total: count, page, limit };
}

export async function GetUsers(page = 1, limit = 20) {
    const { from, to } = getPagination(page, limit);
    const { data, error, count } = await supabase
        .from("users")
        .select("*", { count: 'exact' })
        .order("created_at", { ascending: true })
        .range(from, to);

    if (error) throw error;
    return { users: data, total: count, page, limit };
}

export async function GetStations(page = 1, limit = 20) {
    const { from, to } = getPagination(page, limit);
    const { data, error, count } = await supabase
        .from("stations")
        .select("*", { count: 'exact' })
        .order("created_at", { ascending: true })
        .range(from, to);

    if (error) throw error;
    return { stations: data, total: count, page, limit };
}

export async function GetCards(page = 1, limit = 20) {
    const { from, to } = getPagination(page, limit);
    const { data, error, count } = await supabase
        .from("nfc_cards")
        .select("*", { count: 'exact' })
        .order("created_at", { ascending: true })
        .range(from, to);

    if (error) throw error;
    return { cards: data, total: count, page, limit };
}

export async function GetTrips(page = 1, limit = 20) {
    const { from, to } = getPagination(page, limit);
    const { data, error, count } = await supabase
        .from("trips")
        .select(`
            *,
            user:users!user_id(full_name, national_id),
            entry_station:stations!entry_station_id(name),
            exit_station:stations!exit_station_id(name)
        `, { count: 'exact' })
        .order("entry_time", { ascending: false })
        .range(from, to);

    if (error) throw error;
    return { trips: data, total: count, page, limit };
}

export async function GetScanners(page = 1, limit = 20) {
    const { from, to } = getPagination(page, limit);
    const { data, error, count } = await supabase
        .from("scanner_devices")
        .select(`
            *,
            station:stations!station_id(name)
        `, { count: 'exact' })
        .order("last_heartbeat", { ascending: false })
        .range(from, to);

    if (error) throw error;
    return { scanners: data, total: count, page, limit };
}

