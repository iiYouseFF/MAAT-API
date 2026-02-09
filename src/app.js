import express from "express";

import UserRouter from "./features/user/user.route.js";
import NfcRouter from "./features/nfc/nfc.route.js";
import AuthRouter from "./features/auth/auth.route.js";
import StationRouter from "./features/station/station.route.js";
import ScannerRouter from "./features/scanner/scanner.route.js";
import TripRouter from "./features/trip/trip.route.js";
import AdminRouter from "./features/admin/admin.route.js";

const app = express();

app.use(express.json());

app.use("/api/v1/users", UserRouter);
app.use("/api/v1/nfc", NfcRouter);
app.use("/api/v1/auth", AuthRouter);
app.use("/api/v1/stations", StationRouter);
app.use("/api/v1/scanners", ScannerRouter);
app.use("/api/v1/trips", TripRouter);
app.use("/api/v1/admin", AdminRouter);

export default app;