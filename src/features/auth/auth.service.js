import supabase from "../../config/supabase.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const virtualOTPs = new Map();

export async function SignUp(national_id, full_name, phoneNumber, gender, email, cardId) {
    const { data, error } = await supabase.from("users").insert({
        national_id:national_id,
        full_name:full_name,
        phone: phoneNumber,
        gender:gender,
        email:email,
        card_id: cardId
    })
    .select()
    .single();

    const { data:card, error:cardError} = await supabase.from("nfc_cards").insert({
        card_uid: cardId,
        user_id: data.id,
        status: "active"
    })
    .select()
    .single();
    if (error || cardError) throw error || cardError;

    // Generate JWT Token for automatic login after registration
    const token = jwt.sign(
        { id: data.id, national_id: data.national_id },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
    );

    return { user: data, card: card, token };
}

export async function SendOTP(national_id){
    const { data, error} = await supabase.from("users").select().eq("national_id", national_id).single();
    if (error) throw error;
    else{
        const phoneNumber = data.phone;
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        virtualOTPs.set(national_id, otp);
        return { status: "pending", to: phoneNumber, message: `The OTP For This Number ${phoneNumber} is ${otp}`, otp: otp};
    }
}

export async function VerifyOTP(national_id, OTP){
    const storedOTP = virtualOTPs.get(national_id);
    if (storedOTP === OTP) {
        virtualOTPs.delete(national_id);
        const { data, error } = await supabase.from("users").select().eq("national_id", national_id).single();
        if (error) throw error;
        
        // Generate JWT Token
        const token = jwt.sign(
            { id: data.id, national_id: data.national_id },
            process.env.JWT_SECRET,
            { expiresIn: "30d" } // User stays logged in for 30 days
        );

        return { status: "approved", user: data, token };
    }
    return { status: "rejected" };
}