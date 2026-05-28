import express from "express";
import { login, register } from "../controllers/user";
import validate from "../middleware/validate";
import { createUserValidator, loginValidator } from "../validators/user";

const router = express.Router();

router.post("/register", validate(createUserValidator), register);
router.post("/login", validate(loginValidator), login);

export default router;
