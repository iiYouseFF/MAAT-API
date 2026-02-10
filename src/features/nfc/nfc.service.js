import supabase from "../../config/supabase.js";

export async function RegisterCard(card_uid, user_id = null, registered_by = null) {
    const { data, error } = await supabase.from("nfc_cards").insert({
        card_uid,
        user_id: user_id || null,
        registered_by: registered_by || null,
        status: "active"
    }).select().single();
    if (error) throw error;
    return data;
}

export async function GetCard(card_uid) {
    const { data, error } = await supabase.from("nfc_cards").select().eq("card_uid", card_uid).maybeSingle();
    if (error) {
        throw error;
    }
    return data;
}

export async function GetUserCards(user_id) {
    const { data, error } = await supabase.from("nfc_cards").select().eq("user_id", user_id);
    if (error) {
        throw error;
    }
    return data;
}
