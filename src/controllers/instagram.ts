import { Request, Response } from "express";
import {
  handleInstagramWebhook,
  verifyInstagramWebhook,
} from "../services/instagram";
import metaSettingsService from "../services/metaSettings";

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

/**
 * GET /api/instagram/refresh-token
 * Refreshes the long-lived Instagram access token before it expires.
 * Intended to be hit daily by a scheduler (Vercel Cron). Protected by the
 * CRON_SECRET env var: requires the header `Authorization: Bearer <CRON_SECRET>`,
 * which Vercel Cron sends automatically. If CRON_SECRET is unset the endpoint
 * still works but is UNPROTECTED (a warning is logged).
 */
export const refreshInstagramToken = async (req: Request, res: Response) => {
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn("[IG] token.refresh-unauthorized");
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
  } else {
    console.warn(
      "[IG] token.refresh-unprotected — CRON_SECRET is not set; this endpoint is publicly callable"
    );
  }

  try {
    const result = await metaSettingsService.refreshAccessToken();
    console.log("[IG] token.refresh-result", JSON.stringify(result));
    res.status(200).json(result);
  } catch (err) {
    console.error(
      "[IG] token.refresh-error",
      err instanceof Error ? err.stack : err
    );
    res.status(502).json({
      refreshed: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
};
