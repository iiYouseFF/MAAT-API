import supabase from "../../config/supabase.js";

export function GetAllStations() {
    return supabase.from("stations").select("*")
    .then(({ data, error }) => {
        if (error) throw error;
        return data;
    });
}

export function GetStationById(id) {
    return supabase.from("stations").select("*").eq("id", id).single()
    .then(({ data, error }) => {
        if (error) throw error;
        return data;
    });
}

export function CreateStation(stationData) {
    return supabase.from("stations").insert(stationData)
    .select()
    .single()
    .then(({ data, error }) => {
        if (error) throw error;
        return data;
    });
}
