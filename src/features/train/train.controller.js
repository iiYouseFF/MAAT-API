import * as TrainService from "./train.service.js";

export async function getAllClasses(req, res) {
    try {
        const classes = await TrainService.GetAllClasses();
        res.status(200).json({ classes });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function getAllTrains(req, res) {
    try {
        const { class_id } = req.query;
        const trains = await TrainService.GetAllTrains(class_id ? parseInt(class_id) : null);
        res.status(200).json({ trains });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function getTrainSchedule(req, res) {
    try {
        const { id } = req.params;
        const train = await TrainService.GetTrainSchedule(parseInt(id));
        res.status(200).json({ train });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function getTrainsByRoute(req, res) {
    try {
        const { route_id } = req.params;
        const trains = await TrainService.GetTrainsByRoute(parseInt(route_id));
        res.status(200).json({ trains });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
