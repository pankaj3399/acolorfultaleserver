import {
  GENERAL_REPLY_LIMIT,
  MAX_REPLY_DELAY_MS,
  MIN_REPLY_DELAY_MS,
  PROFESSIONAL_REPLY_LIMIT,
} from "../config/assistant";
import { IntentCategory, MessageRecord } from "../types";

const getRandomDelayMs = () =>
  Math.floor(Math.random() * (MAX_REPLY_DELAY_MS - MIN_REPLY_DELAY_MS + 1)) +
  MIN_REPLY_DELAY_MS;

export const buildAssistantMessage = (
  flow: IntentCategory,
  text: string,
  step: number
): MessageRecord => {
  const message: MessageRecord = {
    sender: "assistant",
    text,
    step,
    delayMs: getRandomDelayMs(),
    createdAt: new Date(),
  };

  if (flow === "PRODUCER" && step === 1) {
    message.quickReplies = ["Creative", "Financing"];
  }

  return message;
};

export const buildUserMessage = (text: string): MessageRecord => ({
  sender: "user",
  text,
  createdAt: new Date(),
});

export const shouldWaitForContact = (flow: IntentCategory, step: number) =>
  flow !== "GENERAL" && step === PROFESSIONAL_REPLY_LIMIT;

export const shouldCompleteAfterReply = (flow: IntentCategory, step: number) =>
  false;
