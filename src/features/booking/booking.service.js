import supabase from "../../config/supabase.js";

export async function createBooking(userId, trainId, passengers, searchParams) {
    // 1. Validate train exists and has enough seats
    const { data: train, error: trainError } = await supabase
        .from("trains")
        .select("*")
        .eq("id", trainId)
        .single();

    if (trainError) throw new Error("Train not found");

    if (train.available_seats < passengers) {
        throw new Error("Not enough available seats");
    }

    // 2. Calculate total fare
    const totalFare = train.fare * passengers;

    // 3. Create booking record
    const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
            user_id: userId,
            train_id: trainId,
            passengers: passengers,
            total_fare: totalFare,
            status: "confirmed",
            booking_date: new Date().toISOString(),
            from_station: searchParams.from,
            to_station: searchParams.to,
            travel_date: searchParams.date,
            ticket_class: searchParams.ticketClass
        })
        .select()
        .single();

    if (bookingError) throw bookingError;

    // 4. Update available seats
    const { error: updateError } = await supabase
        .from("trains")
        .update({ available_seats: train.available_seats - passengers })
        .eq("id", trainId);

    if (updateError) throw updateError;

    return booking;
}

export async function getUserBookings(userId) {
    const { data, error } = await supabase
        .from("bookings")
        .select(`
            *,
            train:trains(*)
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
            train:trains(*)
        `)
        .eq("id", bookingId)
        .eq("user_id", userId)
        .single();

    if (error) throw error;
    return data;
}

export async function cancelBooking(bookingId, userId) {
    // 1. Get booking details
    const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .select("*, train:trains(*)")
        .eq("id", bookingId)
        .eq("user_id", userId)
        .single();

    if (bookingError) throw new Error("Booking not found");
    if (booking.status === "cancelled") throw new Error("Booking already cancelled");

    // 2. Update booking status
    const { error: updateBookingError } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId);

    if (updateBookingError) throw updateBookingError;

    // 3. Return seats to inventory
    const { error: returnSeatsError } = await supabase
        .from("trains")
        .update({ available_seats: booking.train.available_seats + booking.passengers })
        .eq("id", booking.train_id);

    if (returnSeatsError) throw returnSeatsError;

    return { message: "Booking cancelled successfully" };
}
