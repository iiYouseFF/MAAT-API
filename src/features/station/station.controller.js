import * as StationService from "./station.service.js";

export async function getAllStations(req, res) {
    try {
        const stations = await StationService.GetAllStations();
        res.status(200).json({ stations });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function createStation(req, res) {
    try {
        const station = await StationService.CreateStation(req.body);
        res.status(201).json({ message: "Station created", station });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
