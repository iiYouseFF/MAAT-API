import supabase from "../config/supabase.js";

const PEAK_HOURS = [
    { start: 7, end: 9 },
    { start: 17, end: 19 }
];

function isPeakHour() {
    const now = new Date();
    const currentHour = now.getHours();
    return PEAK_HOURS.some(period => currentHour >= period.start && currentHour < period.end);
}

/**
 * Calculate fare between two stations using real pricing data.
 *
 * Strategy:
 *   1. Look up pre-computed fare from `fares` table
 *   2. Fall back to coefficient-based calculation if no pre-computed fare exists
 *   3. Ultimate fallback: distance-based flat rate
 *
 * @param {number|object} entryStation - Station ID or station object
 * @param {number|object} exitStation  - Station ID or station object
 * @param {string} userType - 'standard' or 'regular' (regular gets 10% discount)
 * @returns {number} fare amount
 */
export async function calculateFare(entryStation, exitStation, userType = "standard") {
    const fromId = typeof entryStation === "object" ? entryStation.id : entryStation;
    const toId = typeof exitStation === "object" ? exitStation.id : exitStation;

    let fare = null;

    // Strategy 1: Pre-computed fare lookup
    const { data: precomputed } = await supabase
        .from("fares")
        .select("price")
        .eq("from_station_id", fromId)
        .eq("to_station_id", toId)
        .limit(1)
        .maybeSingle();

    if (precomputed?.price) {
        fare = precomputed.price;
    }

    // Strategy 2: Try reverse direction
    if (fare === null) {
        const { data: reverse } = await supabase
            .from("fares")
            .select("price")
            .eq("from_station_id", toId)
            .eq("to_station_id", fromId)
            .limit(1)
            .maybeSingle();

        if (reverse?.price) {
            fare = reverse.price;
        }
    }

    // Strategy 3: Coefficient-based calculation
    if (fare === null) {
        // Find distance between stations from route_stops
        const { data: fromStop } = await supabase
            .from("route_stops")
            .select("route_id, distance_km")
            .eq("station_id", fromId)
            .limit(1)
            .maybeSingle();

        const { data: toStop } = await supabase
            .from("route_stops")
            .select("route_id, distance_km")
            .eq("station_id", toId)
            .eq("route_id", fromStop?.route_id)
            .limit(1)
            .maybeSingle();

        if (fromStop && toStop) {
            const distance = Math.abs(toStop.distance_km - fromStop.distance_km);

            // Get the first applicable pricing coefficient
            const { data: coeff } = await supabase
                .from("pricing_coefficients")
                .select("coefficient_a, coefficient_b")
                .gte("interval_distance", distance)
                .order("interval_distance", { ascending: true })
                .limit(1)
                .maybeSingle();

            if (coeff) {
                fare = coeff.coefficient_a + coeff.coefficient_b * distance;
            } else {
                // Flat rate fallback: ~0.25 EGP per km
                fare = distance * 0.25;
            }
        }
    }

    // Ultimate fallback
    if (fare === null || fare <= 0) {
        fare = 10; // minimum fare
    }

    // Apply modifiers
    if (isPeakHour()) {
        fare *= 1.15; // 15% peak surcharge
    }

    if (userType === "regular") {
        fare *= 0.9; // 10% loyalty discount
    }

    // Round to nearest 5 (Egyptian railway convention)
    return Math.round(fare / 5) * 5 || 5;
}
