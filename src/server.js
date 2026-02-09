import app from "./app.js";
import dotenv from "dotenv";
dotenv.config();

export default function Server(){
    app.listen(process.env.PORT || 3000, ()=>{
        console.log("Server running on port", process.env.PORT || 3000);
    })
}