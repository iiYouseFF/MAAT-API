import * as UserService from "./user.service.js";

export async function updateProfile(req, res) {
    try {
        const { national_id } = req.params;
        const { full_name, phoneNumber, gender, email } = req.body;
        const user = await UserService.UpdateUser(national_id, full_name, phoneNumber, gender, email);
        res.status(200).json({ message: "User updated successfully", user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function getProfile(req, res) {
    try {
        const { national_id } = req.params;
        const user = await UserService.GetUserByNationalId(national_id);
        res.status(200).json({ user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function GetUserById(req, res){
    try {
        const { user_id } = req.params;
        const user = await UserService.GetUserById(user_id);
        res.status(200).json({ user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function AddBalance(req, res){
    try {
        const { user_id } = req.params;
        const { amount } = req.body;
        const user = await UserService.AddBalance(user_id, amount);
        res.status(200).json({ message: "Balance added successfully", user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
} 

export async function GetBalance(req, res){
    try {
        const {user_id} = req.params;
        const user = await UserService.GetBalance(user_id);
        res.status(200).json({user});
    } catch (error) {
        res.status(500).json({error: error.message});
    }
}