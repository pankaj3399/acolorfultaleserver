import httpStatus from "http-status";
import MetaSettings, { IMetaSettings } from "../models/metaSettings";
import ApiError from "../utils/ApiError";

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
    };
  }

  return {
    configured: true,
    connected: settings.connected,
    accessToken: maskToken(settings.accessToken),
    verifyToken: settings.verifyToken,
    instagramPageId: settings.instagramPageId,
    lastTestedAt: settings.lastTestedAt,
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

  if (existing) {
    existing.accessToken = data.accessToken;
    existing.verifyToken = data.verifyToken;
    if (data.instagramPageId) {
      existing.instagramPageId = data.instagramPageId;
    }
    existing.connected = false;
    existing.lastTestedAt = null;
    await existing.save();
    return existing;
  }

  return MetaSettings.create({
    accessToken: data.accessToken,
    verifyToken: data.verifyToken,
    instagramPageId: data.instagramPageId ?? null,
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
};
