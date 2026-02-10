/**
 * Seed Supabase with cleaned Egyptian Railway data.
 *
 * Prerequisites:
 *   1. Run `python3 scripts/clean_dump.py` first to generate output/ files
 *   2. Run `scripts/migration.sql` in Supabase SQL Editor to create tables
 *   3. Ensure .env has SUPABASE_URL and SUPABASE_KEY
 *
 * Usage:
 *   node scripts/seed_supabase.js
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, "output");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

function loadJSON(filename) {
    const filepath = path.join(OUTPUT_DIR, filename);
    return JSON.parse(fs.readFileSync(filepath, "utf-8"));
}

/**
 * Upsert data in batches to avoid Supabase payload limits.
 */
async function upsertBatch(table, data, batchSize = 500) {
    let inserted = 0;
    for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        const { error } = await supabase.from(table).upsert(batch, { onConflict: "id" });
        if (error) {
            console.error(`  ✗ Error in ${table} batch ${i / batchSize + 1}:`, error.message);
            throw error;
        }
        inserted += batch.length;
    }
    console.log(`  ✓ ${table}: ${inserted} records`);
}

/**
 * Insert data in batches (for tables without 'id' PK conflict).
 */
async function insertBatch(table, data, batchSize = 500) {
    let inserted = 0;
    for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        const { error } = await supabase.from(table).insert(batch);
        if (error) {
            // If duplicate key, try upsert instead
            if (error.code === "23505") {
                const { error: upsertErr } = await supabase.from(table).upsert(batch);
                if (upsertErr) {
                    console.error(`  ✗ Error in ${table} batch ${i / batchSize + 1}:`, upsertErr.message);
                    throw upsertErr;
                }
            } else {
                console.error(`  ✗ Error in ${table} batch ${i / batchSize + 1}:`, error.message);
                throw error;
            }
        }
        inserted += batch.length;
    }
    console.log(`  ✓ ${table}: ${inserted} records`);
}

async function seedStations() {
    const stations = loadJSON("stations.json");

    // Update existing stations table with new columns
    for (let i = 0; i < stations.length; i += 500) {
        const batch = stations.slice(i, i + 500).map((s) => ({
            id: s.id,
            name: s.name_en, // keep backward compatibility
            name_ar: s.name_ar,
            name_en: s.name_en,
            latitude: s.latitude,
            longitude: s.longitude,
            is_active: s.is_active,
        }));

        const { error } = await supabase.from("stations").upsert(batch, { onConflict: "id" });
        if (error) {
            console.error("  ✗ Station batch error:", error.message);
            throw error;
        }
    }
    console.log(`  ✓ stations: ${stations.length} records`);
}

async function main() {
    console.log("🚂 Seeding MAAT Railway Data into Supabase...\n");

    // Seed in dependency order

    // 1. Stations (update existing table)
    console.log("1/8 Seeding stations...");
    await seedStations();

    // 2. Train Classes
    console.log("2/8 Seeding train classes...");
    await upsertBatch("train_classes", loadJSON("classes.json"));

    // 3. Routes
    console.log("3/8 Seeding routes...");
    await upsertBatch("routes", loadJSON("routes.json"));

    // 4. Route Stops
    console.log("4/8 Seeding route stops...");
    await upsertBatch("route_stops", loadJSON("route_stops.json"));

    // 5. Trains
    console.log("5/8 Seeding trains...");
    const trains = loadJSON("trains.json").map((t) => ({
        id: t.id,
        train_number: t.train_number,
        class_id: t.class_id,
        route_id: t.route_id,
        info: t.info,
    }));
    await upsertBatch("trains", trains);

    // 6. Train Schedules (filter orphaned records whose train_id doesn't exist)
    console.log("6/8 Seeding train schedules...");
    const allSchedules = loadJSON("schedules.json");
    const trainIds = new Set(trains.map((t) => t.id));
    const validSchedules = allSchedules.filter((s) => trainIds.has(s.train_id));
    if (validSchedules.length < allSchedules.length) {
        console.log(`  ⚠ Filtered out ${allSchedules.length - validSchedules.length} orphaned schedule records`);
    }
    await upsertBatch("train_schedules", validSchedules);

    // 7. Pricing Profiles
    console.log("7/8 Seeding pricing profiles...");
    await upsertBatch("pricing_profiles", loadJSON("pricing_profiles.json"));

    // 8. Pricing Coefficients
    console.log("8/8 Seeding pricing coefficients...");
    await upsertBatch("pricing_coefficients", loadJSON("pricing_coefficients.json"));

    // 9. Fares (bonus)
    console.log("9/8 Seeding fares...");
    await upsertBatch("fares", loadJSON("fares.json"));

    console.log("\n✅ Seeding complete!");
}

main().catch((err) => {
    console.error("\n❌ Seeding failed:", err.message);
    process.exit(1);
});
