import { Request, Response } from "express";
import httpStatus from "http-status";
import instagramAnalytics from "../services/instagramAnalytics";
import metaSettingsService from "../services/metaSettings";
import catchAsync from "../utils/catchAsync";

// ─── Instagram Conversations ────────────────────────────────────────

export const getInstagramOverview = catchAsync(
  async (_req: Request, res: Response) => {
    const overview = await instagramAnalytics.getOverview();
    res.status(httpStatus.OK).json({ overview });
  }
);

export const getInstagramConversations = catchAsync(
  async (req: Request, res: Response) => {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const exportType = String(req.query.export || "");

    const result = await instagramAnalytics.getConversations({
      page,
      limit,
      search: req.query.search ? String(req.query.search) : undefined,
      status: req.query.status ? String(req.query.status) : undefined,
      profileType: req.query.profileType
        ? String(req.query.profileType)
        : undefined,
      tag: req.query.tag ? String(req.query.tag) : undefined,
      startDate: req.query.startDate ? String(req.query.startDate) : undefined,
      endDate: req.query.endDate ? String(req.query.endDate) : undefined,
    });

    if (exportType === "csv") {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="instagram-conversations.csv"'
      );
      res.status(httpStatus.OK).send(instagramAnalytics.toCsv(result.rows));
      return;
    }

    res.status(httpStatus.OK).json(result);
  }
);

export const getInstagramConversation = catchAsync(
  async (req: Request, res: Response) => {
    const conversation = await instagramAnalytics.getConversationById(
      req.params.id
    );

    if (!conversation) {
      res
        .status(httpStatus.NOT_FOUND)
        .json({ message: "Conversation not found" });
      return;
    }

    res.status(httpStatus.OK).json({ conversation });
  }
);

// ─── Meta Settings ──────────────────────────────────────────────────

export const getMetaSettings = catchAsync(
  async (_req: Request, res: Response) => {
    const settings = await metaSettingsService.getSettingsForClient();
    res.status(httpStatus.OK).json({ settings });
  }
);

export const saveMetaSettings = catchAsync(
  async (req: Request, res: Response) => {
    const { accessToken, verifyToken, instagramPageId } = req.body;

    if (!accessToken || !verifyToken) {
      res
        .status(httpStatus.BAD_REQUEST)
        .json({ message: "accessToken and verifyToken are required" });
      return;
    }

    await metaSettingsService.saveSettings({
      accessToken,
      verifyToken,
      instagramPageId,
    });
    const settings = await metaSettingsService.getSettingsForClient();
    res.status(httpStatus.OK).json({ settings });
  }
);

export const deleteMetaSettings = catchAsync(
  async (_req: Request, res: Response) => {
    const deleted = await metaSettingsService.deleteSettings();
    res.status(httpStatus.OK).json({
      success: deleted,
      message: deleted ? "Disconnected" : "No settings to delete",
    });
  }
);

export const testMetaConnection = catchAsync(
  async (_req: Request, res: Response) => {
    const result = await metaSettingsService.testConnection();
    res.status(httpStatus.OK).json(result);
  }
);
