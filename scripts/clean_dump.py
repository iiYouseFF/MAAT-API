#!/usr/bin/env python3
"""
Clean and transform tut_full_dump.json into Supabase-ready JSON files.

Input:  ../tut_full_dump.json  (raw app database dump)
Output: ./output/*.json        (clean, normalized data per table)
"""

import json
import os
from collections import defaultdict

# ── Paths ──────────────────────────────────────────────────────────
DUMP_PATH = os.path.join(os.path.dirname(__file__), '..', 'tut_full_dump.json')
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), 'output')


def minutes_to_time(minutes):
    """Convert minutes-since-midnight to HH:MM string."""
    if minutes is None or minutes < 0:
        return None
    h = (minutes // 60) % 24
    m = minutes % 60
    return f"{h:02d}:{m:02d}"


def load_dump():
    print(f"Loading {DUMP_PATH}...")
    with open(DUMP_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_json(filename, data):
    path = os.path.join(OUTPUT_DIR, filename)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"  ✓ {filename}: {len(data)} records")


# ── Cleaners ───────────────────────────────────────────────────────

def clean_stations(raw_stations):
    """741 stations → clean format with ar/en names."""
    stations = []
    for s in raw_stations:
        stations.append({
            "id": s["id"],
            "name_ar": s["ar_stationname"].strip(),
            "name_en": s["en_stationname"].strip(),
            "latitude": s.get("lat"),
            "longitude": s.get("lng"),
            "is_active": s.get("disp", 1) == 1
        })
    return stations


def clean_classes(raw_classes):
    """13 train classes → clean format."""
    return [
        {
            "id": c["id"],
            "name_ar": c["ar_classname"].strip(),
            "name_en": c["en_classname"].strip()
        }
        for c in raw_classes
    ]


def clean_routes(raw_sections):
    """
    Sections table groups stations into routes (sectionid).
    Each section = a route with ordered station stops + distances.
    """
    route_map = defaultdict(list)
    for s in raw_sections:
        route_map[s["sectionid"]].append({
            "station_id": s["stationid"],
            "distance_km": s["dist"],
            "stop_order": s["id"]  # original ID preserves ordering within section
        })

    routes = []
    route_stops = []
    stop_id = 1

    for route_id in sorted(route_map.keys()):
        routes.append({"id": route_id})

        # Sort stops by their original ID to preserve order
        stops = sorted(route_map[route_id], key=lambda x: x["stop_order"])

        for order, stop in enumerate(stops, 1):
            route_stops.append({
                "id": stop_id,
                "route_id": route_id,
                "station_id": stop["station_id"],
                "distance_km": stop["distance_km"],
                "stop_order": order
            })
            stop_id += 1

    return routes, route_stops


def clean_trains(raw_travels):
    """831 train services → clean format with references."""
    trains = []
    for t in raw_travels:
        # Parse profile IDs from comma-separated string
        profile_ids = []
        if t.get("profiles"):
            profile_ids = [int(p.strip()) for p in str(t["profiles"]).split(",") if p.strip()]

        trains.append({
            "id": t["id"],
            "train_number": str(t["travelname"]).strip(),
            "class_id": t["classid"],
            "route_id": t["sectionid"],
            "info": t.get("info", "").strip(),
            "profile_ids": profile_ids
        })
    return trains


def clean_schedules(raw_travelsdata):
    """
    14,906 schedule entries → clean arrival/departure times.
    Times are stored as minutes-since-midnight integers.
    """
    schedules = []
    # Group by train to assign stop order
    train_stops = defaultdict(list)
    for td in raw_travelsdata:
        train_stops[td["travelid"]].append(td)

    schedule_id = 1
    for train_id in sorted(train_stops.keys()):
        stops = train_stops[train_id]
        # Sort by arrival time to determine stop order
        stops.sort(key=lambda x: x["arriveschedule"])

        for order, td in enumerate(stops, 1):
            schedules.append({
                "id": schedule_id,
                "train_id": td["travelid"],
                "station_id": td["stationid"],
                "arrival_time": minutes_to_time(td["arriveschedule"]),
                "departure_time": minutes_to_time(td["schedule"]),
                "arrival_minutes": td["arriveschedule"],
                "departure_minutes": td["schedule"],
                "stop_order": order,
                "note": td.get("note", "").strip()
            })
            schedule_id += 1

    return schedules


def clean_pricing_profiles(raw_profiles):
    """44 pricing profiles → clean format."""
    return [
        {
            "id": p["id"],
            "name": p["profilename"].strip(),
            "rounding": int(p["rounding"])
        }
        for p in raw_profiles
    ]


def clean_pricing_coefficients(raw_coeffs):
    """124 pricing coefficients → clean format."""
    return [
        {
            "id": c["id"],
            "profile_id": c["profileid"],
            "interval_distance": c["intervaldistance"],
            "coefficient_a": round(c["a"], 6),
            "coefficient_b": round(c["b"], 6)
        }
        for c in raw_coeffs
    ]


def clean_fares(raw_spreadsheet):
    """
    1,754 pre-computed fares.
    Columns: p=profile_id, a=from_station_id, b=to_station_id, d=distance, y=price
    """
    return [
        {
            "id": s["id"],
            "profile_id": s["p"],
            "from_station_id": s["a"],
            "to_station_id": s["b"],
            "distance_km": s["d"],
            "price": s["y"]
        }
        for s in raw_spreadsheet
    ]


# ── Main ───────────────────────────────────────────────────────────

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    data = load_dump()

    print("\nCleaning data...")

    # 1. Stations
    stations = clean_stations(data["stations"])
    save_json("stations.json", stations)

    # 2. Classes
    classes = clean_classes(data["classes"])
    save_json("classes.json", classes)

    # 3. Routes & Route Stops
    routes, route_stops = clean_routes(data["sections"])
    save_json("routes.json", routes)
    save_json("route_stops.json", route_stops)

    # 4. Trains
    trains = clean_trains(data["travels"])
    save_json("trains.json", trains)

    # 5. Schedules
    schedules = clean_schedules(data["travelsdata"])
    save_json("schedules.json", schedules)

    # 6. Pricing Profiles
    profiles = clean_pricing_profiles(data["profiles"])
    save_json("pricing_profiles.json", profiles)

    # 7. Pricing Coefficients
    coefficients = clean_pricing_coefficients(data["profiles_coeffs"])
    save_json("pricing_coefficients.json", coefficients)

    # 8. Pre-computed Fares
    fares = clean_fares(data["spread_sheet"])
    save_json("fares.json", fares)

    # Summary
    total = sum([
        len(stations), len(classes), len(routes), len(route_stops),
        len(trains), len(schedules), len(profiles), len(coefficients), len(fares)
    ])
    print(f"\n✅ Done! {total} total records across 9 files in {OUTPUT_DIR}/")

    # Print some stats
    print(f"\n📊 Summary:")
    print(f"   Stations:    {len(stations)} ({sum(1 for s in stations if s['is_active'])} active)")
    print(f"   Classes:     {len(classes)}")
    print(f"   Routes:      {len(routes)}")
    print(f"   Route Stops: {len(route_stops)}")
    print(f"   Trains:      {len(trains)}")
    print(f"   Schedules:   {len(schedules)}")
    print(f"   Profiles:    {len(profiles)}")
    print(f"   Coefficients:{len(coefficients)}")
    print(f"   Fares:       {len(fares)}")


if __name__ == "__main__":
    main()
