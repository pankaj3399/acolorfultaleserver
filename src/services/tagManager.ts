import { ConversationTag, IntentCategory } from "../types";
import { getCreativeSubtypeTags } from "./keywordRouter";

export const addUniqueTags = (
  currentTags: ConversationTag[],
  nextTags: ConversationTag[]
) => {
  const merged = new Set(currentTags);
  nextTags.forEach((tag) => merged.add(tag));
  return Array.from(merged) as ConversationTag[];
};

export const mapIntentToTags = (
  category: IntentCategory,
  message: string
): ConversationTag[] => {
  if (category === "INVESTOR") {
    return ["INVESTOR"];
  }

  if (category === "PRODUCER") {
    return ["PRODUCER"];
  }

  if (category === "CREATIVE") {
    return ["CREATIVE", ...getCreativeSubtypeTags(message)];
  }

  return ["GENERAL_SUPPORT"];
};
