import * as ScannerService from "./scanner.service.js";

export async function registerScanner(req, res){
    try {
        const { station_id, type } = req.body;
        const apiKey = await ScannerService.RegisterScanner(station_id, type);
        return res.status(200).json({
            message: "Scanner Registered Successfully", 
            api_key: apiKey
        });
    } catch (error) {
        return res.status(500).json({error: error.message});
    }
}


export async function handleTrip(req, res){
    try {
        const { api_key, card_id } = req.body;
        // The service function expects (card_uid, station_id, api_key)
        const result = await ScannerService.ScanCard(card_id, api_key);
        
        return res.status(200).json({
            message: "Successfully processed scan", 
            data: result
        });
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
}
