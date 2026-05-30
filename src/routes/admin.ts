import express from "express";
import rateLimit from "express-rate-limit";
import {
  adminLogin,
  getAdminMe,
  getAnalyticsFunnel,
  getAnalyticsList,
  getAnalyticsOverview,
  getAnalyticsTags,
} from "../controllers/admin";
import {
  getInstagramOverview,
  getInstagramConversations,
  getInstagramConversation,
  getMetaSettings,
  saveMetaSettings,
  deleteMetaSettings,
  testMetaConnection,
} from "../controllers/instagramAdmin";
import { authMiddleware } from "../middleware/auth";
import validate from "../middleware/validate";
import { adminLoginValidator, analyticsListValidator } from "../validators/admin";

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/login", loginLimiter, validate(adminLoginValidator), adminLogin);
router.get("/me", authMiddleware, getAdminMe);
router.get("/analytics/overview", authMiddleware, getAnalyticsOverview);
router.get(
  "/analytics/list",
  authMiddleware,
  validate(analyticsListValidator),
  getAnalyticsList
);
router.get("/analytics/tags", authMiddleware, getAnalyticsTags);
router.get("/analytics/funnel", authMiddleware, getAnalyticsFunnel);

// ─── Instagram Admin ────────────────────────────────────────────────
router.get("/instagram/overview", authMiddleware, getInstagramOverview);
router.get("/instagram/conversations", authMiddleware, getInstagramConversations);
router.get("/instagram/conversations/:id", authMiddleware, getInstagramConversation);

// ─── Meta Settings ──────────────────────────────────────────────────
router.get("/settings/meta", authMiddleware, getMetaSettings);
router.post("/settings/meta", authMiddleware, saveMetaSettings);
router.delete("/settings/meta", authMiddleware, deleteMetaSettings);
router.post("/settings/meta/test", authMiddleware, testMetaConnection);

export default router;
