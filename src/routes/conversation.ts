import express from "express";
import {
  getConversation,
  sendConversationMessage,
  startConversation,
} from "../controllers/conversation";
import validate from "../middleware/validate";
import {
  getConversationValidator,
  sendMessageValidator,
  startConversationValidator,
} from "../validators/conversation";

const router = express.Router();

router.post("/start", validate(startConversationValidator), startConversation);
router.post("/message", validate(sendMessageValidator), sendConversationMessage);
router.get("/:id", validate(getConversationValidator), getConversation);

export default router;
