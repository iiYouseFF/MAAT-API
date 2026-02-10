-- ============================================================
-- MAAT Railway Data - Supabase Migration
-- Run this in Supabase SQL Editor before seeding
-- ============================================================

-- 1. Train Classes (Spanish, VIP, Russian, Sleeping, etc.)
CREATE TABLE IF NOT EXISTS train_classes (
  id INT PRIMARY KEY,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL
);

-- 2. Routes (line/section IDs)
CREATE TABLE IF NOT EXISTS routes (
  id INT PRIMARY KEY
);

-- 3. Route Stops (ordered stations in a route with distances)
CREATE TABLE IF NOT EXISTS route_stops (
  id SERIAL PRIMARY KEY,
  route_id INT REFERENCES routes(id) ON DELETE CASCADE,
  station_id INT,
  distance_km FLOAT DEFAULT 0,
  stop_order INT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_route_stops_route ON route_stops(route_id);
CREATE INDEX IF NOT EXISTS idx_route_stops_station ON route_stops(station_id);

-- 4. Trains (individual services)
CREATE TABLE IF NOT EXISTS trains (
  id INT PRIMARY KEY,
  train_number TEXT NOT NULL,
  class_id INT REFERENCES train_classes(id),
  route_id INT REFERENCES routes(id),
  info TEXT DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_trains_class ON trains(class_id);
CREATE INDEX IF NOT EXISTS idx_trains_route ON trains(route_id);

-- 5. Train Schedules (per-station times)
CREATE TABLE IF NOT EXISTS train_schedules (
  id SERIAL PRIMARY KEY,
  train_id INT REFERENCES trains(id) ON DELETE CASCADE,
  station_id INT,
  arrival_time TEXT,
  departure_time TEXT,
  arrival_minutes INT,
  departure_minutes INT,
  stop_order INT NOT NULL,
  note TEXT DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_schedules_train ON train_schedules(train_id);
CREATE INDEX IF NOT EXISTS idx_schedules_station ON train_schedules(station_id);

-- 6. Pricing Profiles
CREATE TABLE IF NOT EXISTS pricing_profiles (
  id INT PRIMARY KEY,
  name TEXT NOT NULL,
  rounding INT DEFAULT 5
);

-- 7. Pricing Coefficients (fare formula: price = a + b * distance)
CREATE TABLE IF NOT EXISTS pricing_coefficients (
  id INT PRIMARY KEY,
  profile_id INT REFERENCES pricing_profiles(id) ON DELETE CASCADE,
  interval_distance FLOAT,
  coefficient_a FLOAT,
  coefficient_b FLOAT
);
CREATE INDEX IF NOT EXISTS idx_coeffs_profile ON pricing_coefficients(profile_id);

-- 8. Pre-computed Fares
CREATE TABLE IF NOT EXISTS fares (
  id INT PRIMARY KEY,
  profile_id INT,
  from_station_id INT,
  to_station_id INT,
  distance_km FLOAT,
  price FLOAT
);
CREATE INDEX IF NOT EXISTS idx_fares_stations ON fares(from_station_id, to_station_id);
CREATE INDEX IF NOT EXISTS idx_fares_profile ON fares(profile_id);

-- 9. Add bilingual columns to existing stations table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stations' AND column_name = 'name_ar') THEN
    ALTER TABLE stations ADD COLUMN name_ar TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stations' AND column_name = 'name_en') THEN
    ALTER TABLE stations ADD COLUMN name_en TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stations' AND column_name = 'latitude') THEN
    ALTER TABLE stations ADD COLUMN latitude TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stations' AND column_name = 'longitude') THEN
    ALTER TABLE stations ADD COLUMN longitude TEXT;
  END IF;
END $$;
