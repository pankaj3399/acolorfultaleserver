import express from "express";
import admin from "./admin";
import conversation from "./conversation";
import instagram from "./instagram";
import user from "./user";

const router = express.Router();

router.use("/admin", admin);
router.use("/conversations", conversation);
router.use("/instagram", instagram);
router.use("/user", user);

export default router;
