import express from "express";
import {
  webhookVerification,
  webhookHandler,
  refreshInstagramToken,
} from "../controllers/instagram";

const router = express.Router();

// Meta webhook verification (subscription setup)
router.get("/webhook", webhookVerification);

// Meta webhook events (incoming DMs)
router.post("/webhook", webhookHandler);

// Long-lived token auto-renewal (hit daily by Vercel Cron; protected by CRON_SECRET)
router.get("/refresh-token", refreshInstagramToken);

export default router;
