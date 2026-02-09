import app from "./app.js";
import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT || 3000;
const ENV = process.env.NODE_ENV || "development";

export default function Server() {
  app.listen(PORT, () => {
    console.log(`[MAAT API] Server running in ${ENV} mode on port ${PORT}`);
  });
}