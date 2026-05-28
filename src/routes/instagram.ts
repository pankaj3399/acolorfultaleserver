import express from "express";
import {
  webhookVerification,
  webhookHandler,
} from "../controllers/instagram";

const router = express.Router();

// Meta webhook verification (subscription setup)
router.get("/webhook", webhookVerification);

// Meta webhook events (incoming DMs)
router.post("/webhook", webhookHandler);

export default router;
