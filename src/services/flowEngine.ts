import {
  FLOW_MESSAGES,
  GENERAL_REPLY_LIMIT,
  GENERAL_CONTINUATION_MESSAGES,
  PROFESSIONAL_REPLY_LIMIT,
} from "../config/assistant";
import { IntentCategory } from "../types";

export const getReplyLimitForFlow = (flow: IntentCategory) =>
  flow === "GENERAL" ? GENERAL_REPLY_LIMIT : PROFESSIONAL_REPLY_LIMIT;

export const getFlowReply = (
  flow: IntentCategory,
  step: number,
  branch?: "creative" | "financing" | null
) => {
  if (flow === "GENERAL" && step > GENERAL_REPLY_LIMIT) {
    return GENERAL_CONTINUATION_MESSAGES[
      (step - GENERAL_REPLY_LIMIT - 1) % GENERAL_CONTINUATION_MESSAGES.length
    ];
  }

  if (flow === "PRODUCER") {
    if (step === 1) {
      return FLOW_MESSAGES.PRODUCER[0];
    }

    if (branch === "creative") {
      return FLOW_MESSAGES.CREATIVE[step - 1];
    }

    return FLOW_MESSAGES.PRODUCER[step - 1];
  }

  return FLOW_MESSAGES[flow][step - 1];
};
