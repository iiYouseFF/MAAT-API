import supabase from "../../config/supabase.js";
import * as nfcService from "../nfc/nfc.service.js";
import * as stationService from "../station/station.service.js";
import * as tripService from "../trip/trip.service.js";
import * as userService from "../user/user.service.js";
import crypto from "crypto";

export async function ValidateScanner(api_key) {
    const { data, error } = await supabase
        .from("scanner_devices")
        .select("*")
        .eq("api_key", api_key)
        .eq("is_active", true)
        .single();

    if (error || !data) return null;
    return data;
}

export async function UpdateScannerHeartbeat(id) {
    const { error } = await supabase
        .from("scanner_devices")
        .update({ last_heartbeat: new Date().toISOString() })
        .eq("id", id);
        
    if (error) throw error;
}

export async function GenerateApiKey(){
    return crypto.randomUUID();
}

export async function RegisterScanner(station_id, type){
    const apiKey = await GenerateApiKey();
    const { error } = await supabase
        .from("scanner_devices")
        .insert({
            station_id: station_id,
            type: type,
            api_key: apiKey,
            is_active: true,
            last_heartbeat: new Date().toISOString(),
        });
    
    if (error) throw error;
    return apiKey;
}

export async function ScanCard(card_uid, api_key){
    const scanner = await ValidateScanner(api_key);
    const station_id = scanner.station_id;
    if (!scanner) {
        throw new Error("Invalid or inactive scanner API key");
    }

    // Update heartbeat
    await UpdateScannerHeartbeat(scanner.id);

    const card = await nfcService.GetCard(card_uid);
    if (!card) {
        throw new Error("NFC Card not found");
    }

    if (scanner.type === "entry") {
        return await tripService.handleEntry(card.card_uid, station_id);
    }

    if (scanner.type === "exit") {
        return await tripService.handleExit(card.card_uid, station_id);
    }

    if (scanner.type === "register") {
        const user = await userService.GetUserById(card.user_id);
        if (!user) {
            throw new Error("User associated with this card not found");
        }
        return { user, card };
    }

    throw new Error(`Unsupported scanner type: ${scanner.type}`);
}