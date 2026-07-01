import httpStatus from "http-status";
import MetaSettings, { IMetaSettings } from "../models/metaSettings";
import ApiError from "../utils/ApiError";

/** A fresh long-lived Instagram token is valid ~60 days. */
const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;
/** Refresh once the token is within this window of expiring (cheap no-op before that). */
const REFRESH_WINDOW_MS = 10 * 24 * 60 * 60 * 1000;

/**
 * Get the single Meta settings document (there's only ever one).
 */
const getSettings = async (): Promise<IMetaSettings | null> => {
  return MetaSettings.findOne().lean() as any;
};

/**
 * Get settings formatted for the frontend (masks the access token).
 */
const getSettingsForClient = async () => {
  const settings = await getSettings();
  if (!settings) {
    return {
      configured: false,
      connected: false,
      accessToken: null,
      verifyToken: null,
      instagramPageId: null,
      lastTestedAt: null,
      tokenExpiresAt: null,
    };
  }

  return {
    configured: true,
    connected: settings.connected,
    accessToken: maskToken(settings.accessToken),
    verifyToken: settings.verifyToken,
    instagramPageId: settings.instagramPageId,
    lastTestedAt: settings.lastTestedAt,
    tokenExpiresAt: settings.tokenExpiresAt,
  };
};

/**
 * Save (create or update) Meta credentials.
 */
const saveSettings = async (data: {
  accessToken: string;
  verifyToken: string;
  instagramPageId?: string;
}) => {
  const existing = await MetaSettings.findOne();

  // A freshly-pasted long-lived token is valid ~60 days. The exact value is
  // corrected on the first successful refresh (from the API's expires_in).
  const estimatedExpiry = new Date(Date.now() + SIXTY_DAYS_MS);

  if (existing) {
    existing.accessToken = data.accessToken;
    existing.verifyToken = data.verifyToken;
    if (data.instagramPageId) {
      existing.instagramPageId = data.instagramPageId;
    }
    existing.connected = false;
    existing.lastTestedAt = null;
    existing.tokenExpiresAt = estimatedExpiry;
    await existing.save();
    return existing;
  }

  return MetaSettings.create({
    accessToken: data.accessToken,
    verifyToken: data.verifyToken,
    instagramPageId: data.instagramPageId ?? null,
    tokenExpiresAt: estimatedExpiry,
  });
};

/**
 * Delete/disconnect Meta settings.
 */
const deleteSettings = async () => {
  const result = await MetaSettings.deleteMany({});
  return result.deletedCount > 0;
};

/**
 * Test connection by calling Instagram Graph API /me endpoint.
 */
const testConnection = async () => {
  const settings = await MetaSettings.findOne();
  if (!settings) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Meta credentials not configured"
    );
  }

  const res = await fetch(
    `https://graph.instagram.com/v18.0/me?fields=id,name,username&access_token=${settings.accessToken}`
  );

  if (!res.ok) {
    const body = await res.text();
    settings.connected = false;
    await settings.save();
    throw new ApiError(
      httpStatus.BAD_GATEWAY,
      `Instagram API error: ${body}`
    );
  }

  const data = (await res.json()) as { id?: string; name?: string; username?: string };

  settings.connected = true;
  settings.instagramPageId = data.id ?? null;
  settings.lastTestedAt = new Date();
  await settings.save();

  return {
    connected: true,
    instagramPageId: data.id,
    name: data.name,
    username: data.username,
  };
};

/**
 * Get the active access token (used by the webhook service).
 * Falls back to env var if no DB settings exist.
 */
const getAccessToken = async (): Promise<string | null> => {
  const settings = await MetaSettings.findOne().select("accessToken").lean();
  return settings?.accessToken ?? process.env.INSTAGRAM_ACCESS_TOKEN ?? null;
};

/**
 * Get the verify token (used by webhook verification).
 * Falls back to env var if no DB settings exist.
 */
const getVerifyToken = async (): Promise<string | null> => {
  const settings = await MetaSettings.findOne().select("verifyToken").lean();
  return settings?.verifyToken ?? process.env.INSTAGRAM_VERIFY_TOKEN ?? null;
};

/**
 * Refresh the long-lived Instagram access token so it never lapses.
 *
 * A long-lived token can be exchanged for a fresh 60-day token while it is
 * still valid (and at least 24h old). An already-expired token cannot be
 * recovered this way — it must be re-pasted once via saveSettings. This is
 * safe to call daily: it no-ops unless the token is close to expiring.
 */
const refreshAccessToken = async (): Promise<
  | { refreshed: false; reason: "not_configured" | "not_due"; tokenExpiresAt?: Date | null }
  | { refreshed: true; tokenExpiresAt: Date; expiresInSeconds: number }
> => {
  const settings = await MetaSettings.findOne();
  if (!settings) {
    return { refreshed: false, reason: "not_configured" };
  }

  // Cheap no-op: skip while the token still has more than the refresh window left.
  if (
    settings.tokenExpiresAt &&
    settings.tokenExpiresAt.getTime() - Date.now() > REFRESH_WINDOW_MS
  ) {
    return {
      refreshed: false,
      reason: "not_due",
      tokenExpiresAt: settings.tokenExpiresAt,
    };
  }

  const res = await fetch(
    `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${settings.accessToken}`
  );

  if (!res.ok) {
    const body = await res.text();
    settings.connected = false;
    await settings.save();
    console.error(
      "[IG] token.refresh-failed",
      JSON.stringify({ status: res.status, response: body })
    );
    throw new ApiError(
      httpStatus.BAD_GATEWAY,
      `Instagram token refresh failed (${res.status}): ${body}. ` +
        `If the token has fully expired it cannot be auto-refreshed — paste a new long-lived token via settings.`
    );
  }

  const data = (await res.json()) as {
    access_token?: string;
    token_type?: string;
    expires_in?: number;
  };

  if (!data.access_token || !data.expires_in) {
    settings.connected = false;
    await settings.save();
    throw new ApiError(
      httpStatus.BAD_GATEWAY,
      `Instagram token refresh returned an unexpected payload: ${JSON.stringify(data)}`
    );
  }

  const tokenExpiresAt = new Date(Date.now() + data.expires_in * 1000);
  settings.accessToken = data.access_token;
  settings.tokenExpiresAt = tokenExpiresAt;
  settings.connected = true;
  await settings.save();

  console.log(
    "[IG] token.refreshed",
    JSON.stringify({ tokenExpiresAt, expiresInSeconds: data.expires_in })
  );

  return {
    refreshed: true,
    tokenExpiresAt,
    expiresInSeconds: data.expires_in,
  };
};

const maskToken = (token: string) => {
  if (token.length <= 8) return "****";
  return token.slice(0, 4) + "****" + token.slice(-4);
};

export default {
  getSettings,
  getSettingsForClient,
  saveSettings,
  deleteSettings,
  testConnection,
  getAccessToken,
  getVerifyToken,
  refreshAccessToken,
};
