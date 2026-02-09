import supabase from "../../config/supabase.js";

export async function UpdateUser(id, updateData) {
    const { data, error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function GetUserByNationalId(national_id) {
    const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("national_id", national_id)
        .single();
    if (error) throw error;
    return data;
}

export async function GetUserById(id) {
    const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", id)
        .single();
    if (error) throw error;
    return data;
}


export async function AddBalance(user_id, amount){
    const { data, error } = await supabase.from("users").select("balance").eq("id", user_id).single();
    const newBalance = data.balance + amount;
    const { data: updatedUser, error: updateError } = await supabase.from("users").update({balance: newBalance}).eq("id", user_id).select().single();
    if (updateError || error) throw updateError || error;
    return updatedUser;
}

export async function GetBalance(user_id){
    const { data, error } = await supabase.from("users").select("balance").eq("id", user_id).single();
    if (error) throw error;
    return data;
}