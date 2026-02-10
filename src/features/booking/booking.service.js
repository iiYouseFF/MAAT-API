import supabase from "../../config/supabase.js";
import { calculateFare } from "../../utils/fareEngine.js";

export async function createBooking(userId, trainId, passengers, searchParams) {
    // 1. Validate train exists
    const { data: train, error: trainError } = await supabase
        .from("trains")
        .select("id, train_number, class_id, train_classes(name_ar, name_en)")
        .eq("id", trainId)
        .single();

    if (trainError || !train) throw new Error("Train not found");

    // 2. Resolve station IDs for fare calculation
    let fromStationId = null;
    let toStationId = null;

    if (searchParams?.from) {
        const { data: fromStations } = await supabase
            .from("stations")
            .select("id")
            .or(`name_ar.ilike.%${searchParams.from}%,name_en.ilike.%${searchParams.from}%`)
            .limit(1);
        if (fromStations?.length) fromStationId = fromStations[0].id;
    }

    if (searchParams?.to) {
        const { data: toStations } = await supabase
            .from("stations")
            .select("id")
            .or(`name_ar.ilike.%${searchParams.to}%,name_en.ilike.%${searchParams.to}%`)
            .limit(1);
        if (toStations?.length) toStationId = toStations[0].id;
    }

    // 3. Calculate fare using real pricing engine
    let farePerPassenger = 0;
    if (fromStationId && toStationId) {
        farePerPassenger = await calculateFare(fromStationId, toStationId);
    }

    const totalFare = farePerPassenger * passengers;

    // 4. Check user balance
    const { data: user, error: userError } = await supabase
        .from("users")
        .select("balance")
        .eq("id", userId)
        .single();

    if (userError || !user) throw new Error("User not found");

    if ((user.balance || 0) < totalFare) {
        throw new Error(`Insufficient balance. Required: ${totalFare} EGP, Available: ${user.balance || 0} EGP`);
    }

    // 5. Deduct balance
    const newBalance = (user.balance || 0) - totalFare;
    const { error: balanceError } = await supabase
        .from("users")
        .update({ balance: newBalance })
        .eq("id", userId);

    if (balanceError) throw new Error("Failed to deduct balance");

    // 6. Create booking record
    const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
            user_id: userId,
            train_id: trainId,
            passengers,
            fare_per_passenger: farePerPassenger,
            total_fare: totalFare,
            status: "confirmed",
            booking_date: new Date().toISOString(),
            from_station: searchParams?.from || null,
            to_station: searchParams?.to || null,
            from_station_id: fromStationId,
            to_station_id: toStationId,
            travel_date: searchParams?.date || null,
            ticket_class: train.train_classes?.name_en || searchParams?.ticketClass || null,
        })
        .select()
        .single();

    if (bookingError) {
        // Refund balance if booking insert fails
        await supabase
            .from("users")
            .update({ balance: user.balance })
            .eq("id", userId);
        throw bookingError;
    }

    return {
        ...booking,
        train_number: train.train_number,
        train_class: train.train_classes,
        fare_per_passenger: farePerPassenger,
        remaining_balance: newBalance,
    };
}

export async function getUserBookings(userId) {
    const { data, error } = await supabase
        .from("bookings")
        .select(`
            *,
            train:trains(id, train_number, class_id, train_classes(name_ar, name_en))
        `)
        .eq("user_id", userId)
        .order("booking_date", { ascending: false });

    if (error) throw error;
    return data;
}

export async function getBookingById(bookingId, userId) {
    const { data, error } = await supabase
        .from("bookings")
        .select(`
            *,
            train:trains(id, train_number, class_id, train_classes(name_ar, name_en))
        `)
        .eq("id", bookingId)
        .eq("user_id", userId)
        .single();

    if (error) throw error;
    return data;
}

export async function cancelBooking(bookingId, userId) {
    // 1. Get booking
    const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .eq("user_id", userId)
        .single();

    if (bookingError) throw new Error("Booking not found");
    if (booking.status === "cancelled") throw new Error("Booking already cancelled");

    // 2. Update booking status
    const { error: updateError } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId);

    if (updateError) throw updateError;

    // 3. Refund balance to user
    const { data: user } = await supabase
        .from("users")
        .select("balance")
        .eq("id", userId)
        .single();

    if (user) {
        const refundedBalance = (user.balance || 0) + booking.total_fare;
        await supabase
            .from("users")
            .update({ balance: refundedBalance })
            .eq("id", userId);
    }

    return { message: "Booking cancelled and balance refunded successfully" };
}
