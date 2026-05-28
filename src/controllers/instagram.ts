import { Request, Response } from "express";
import {
  handleInstagramWebhook,
  verifyInstagramWebhook,
} from "../services/instagram";

/**
 * GET /api/instagram/webhook
 * Meta calls this to verify the webhook subscription.
 */
export const webhookVerification = async (req: Request, res: Response) => {
  console.log("[IG] http.GET /webhook (verification)", JSON.stringify(req.query));
  const result = await verifyInstagramWebhook(req.query as any);

  if (result.success) {
    console.log("[IG] ✅ webhook.verified");
    res.status(200).send(result.challenge);
  } else {
    console.warn("[IG] ❌ webhook.verify-failed");
    res.sendStatus(403);
  }
};

/**
 * POST /api/instagram/webhook
 * Meta sends incoming DM events here.
 * We respond 200 immediately, then process asynchronously.
 */
export const webhookHandler = async (req: Request, res: Response) => {
  console.log(
    "[IG] http.POST /webhook",
    JSON.stringify({
      contentType: req.headers["content-type"],
      bodyKeys: req.body ? Object.keys(req.body) : [],
      entryCount: Array.isArray(req.body?.entry) ? req.body.entry.length : 0,
    })
  );

  try {
    await handleInstagramWebhook(req.body);
  } catch (err) {
    console.error(
      "[IG] webhook.processing-error",
      err instanceof Error ? err.stack : err
    );
  }

  res.status(200).send("EVENT_RECEIVED");
};
