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
    const { count: bookingsCount } = await supabase.from("bookings").select("*", { count: 'exact', head: true });

    const { data: revenueData } = await supabase.from("admin_top_up_logs").select("amount");
    const totalRevenue = revenueData?.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0) || 0;

    // Count unpaired cards
    const { count: unpairedCards } = await supabase.from("nfc_cards").select("*", { count: 'exact', head: true }).is("user_id", null);

    return {
        users: usersCount || 0,
        active_trips: activeTripsCount || 0,
        registered_cards: cardsCount || 0,
        unpaired_cards: unpairedCards || 0,
        bookings: bookingsCount || 0,
        total_revenue: totalRevenue
    };
}

// ========== USER MANAGEMENT ==========

export async function CreateUser({ national_id, full_name, email, phone, gender, card_uid }) {
    // Create user
    const { data: user, error } = await supabase.from("users").insert({
        national_id,
        full_name,
        email,
        phone,
        gender: gender || null,
        balance: 0,
        role: "user"
    }).select().single();

    if (error) throw error;

    // Pair NFC tag if provided
    if (card_uid) {
        const { error: cardError } = await supabase
            .from("nfc_cards")
            .update({ user_id: user.id })
            .eq("card_uid", card_uid)
            .is("user_id", null);

        if (cardError) throw new Error("Failed to pair NFC tag: " + cardError.message);
    }

    return user;
}

export async function TopUpUser(userId, amount, paymentMethod, adminId) {
    // Get current balance
    const { data: user, error: userError } = await supabase
        .from("users")
        .select("balance")
        .eq("id", userId)
        .single();

    if (userError || !user) throw new Error("User not found");

    const newBalance = (user.balance || 0) + amount;

    // Update balance
    const { error: updateError } = await supabase
        .from("users")
        .update({ balance: newBalance })
        .eq("id", userId);

    if (updateError) throw new Error("Failed to update balance");

    // Log the top-up
    await supabase.from("admin_top_up_logs").insert({
        admin_id: adminId,
        user_id: userId,
        amount,
        payment_method: paymentMethod
    });

    return { userId, newBalance, amount, paymentMethod };
}

// ========== NFC TAG MANAGEMENT ==========

export async function RegisterNfcTag(cardUid, adminId) {
    // Check if already exists
    const { data: existing } = await supabase
        .from("nfc_cards")
        .select("id")
        .eq("card_uid", cardUid)
        .maybeSingle();

    if (existing) throw new Error("NFC tag already registered");

    const { data, error } = await supabase.from("nfc_cards").insert({
        card_uid: cardUid,
        user_id: null,
        registered_by: adminId,
        status: "active"
    }).select().single();

    if (error) throw error;
    return data;
}

export async function GetUnpairedCards(adminId = null) {
    let query = supabase
        .from("nfc_cards")
        .select("*")
        .is("user_id", null)
        .order("created_at", { ascending: false });

    // Optionally filter by admin who registered them
    if (adminId) {
        query = query.eq("registered_by", adminId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
}

// ========== EXISTING LISTING FUNCTIONS ==========

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
        .select("id, national_id, full_name, email, phone, gender, balance, role, created_at", { count: 'exact' })
        .order("created_at", { ascending: false })
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
        .select(`
            *,
            user:users!nfc_cards_user_id_fkey(full_name, national_id)
        `, { count: 'exact' })
        .order("created_at", { ascending: false })
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

export async function GetAllBookings(page = 1, limit = 20) {
    const { from, to } = getPagination(page, limit);
    const { data, error, count } = await supabase
        .from("bookings")
        .select(`
            *,
            user:users!bookings_user_id_fkey(full_name, email)
        `, { count: 'exact' })
        .order("booking_date", { ascending: false })
        .range(from, to);

    if (error) throw error;
    return { bookings: data, total: count, page, limit };
}

