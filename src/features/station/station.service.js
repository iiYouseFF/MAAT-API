import supabase from "../../config/supabase.js";

export async function GetAllStations() {
    const { data, error } = await supabase
        .from("stations")
        .select("id, name, name_ar, name_en, latitude, longitude, is_active")
        .eq("is_active", true)
        .order("name_en");

    if (error) throw error;
    return data;
}

export async function GetStationById(id) {
    const { data, error } = await supabase
        .from("stations")
        .select("*")
        .eq("id", id)
        .single();

    if (error) throw error;
    return data;
}

export async function SearchStations(query) {
    // Search in both Arabic and English names
    const { data, error } = await supabase
        .from("stations")
        .select("id, name, name_ar, name_en")
        .eq("is_active", true)
        .or(`name_ar.ilike.%${query}%,name_en.ilike.%${query}%`)
        .limit(15);

    if (error) throw error;
    return data;
}

export async function CreateStation(stationData) {
    const { data, error } = await supabase
        .from("stations")
        .insert(stationData)
        .select()
        .single();

    if (error) throw error;
    return data;
}
