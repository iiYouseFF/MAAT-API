-- ============================================================
-- MAAT Bookings Table Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- Drop old table if it had wrong FK
DROP TABLE IF EXISTS bookings;

CREATE TABLE bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    train_id INT REFERENCES trains(id),
    passengers INT NOT NULL DEFAULT 1,
    fare_per_passenger FLOAT NOT NULL DEFAULT 0,
    total_fare FLOAT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
    booking_date TIMESTAMPTZ DEFAULT NOW(),
    from_station TEXT,
    to_station TEXT,
    from_station_id INT,
    to_station_id INT,
    travel_date TEXT,
    ticket_class TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_train ON bookings(train_id);
CREATE INDEX idx_bookings_status ON bookings(status);
