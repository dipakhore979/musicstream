import { Router } from "express";
import mongoose from "mongoose";
import { sendSuccess } from "../utils/apiResponse.js";

const router = Router();
const DB_STATES = ["disconnected", "connected", "connecting", "disconnecting"];

router.get("/", (_req, res) => {
  sendSuccess(res, {
    data: {
      status: "ok",
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      database: DB_STATES[mongoose.connection.readyState] ?? "unknown",
    },
  });
});

export default router;
