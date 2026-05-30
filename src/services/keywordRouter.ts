import {
  CREATIVE_KEYWORDS,
  CREATIVE_SUBTYPE_TAGS,
  INVESTOR_KEYWORDS,
  PRODUCER_KEYWORDS,
} from "../config/assistant";
import { ConversationTag, IntentCategory } from "../types";

const normalizeText = (value: string) => value.trim().toLowerCase();

const includesAnyKeyword = (message: string, keywords: string[]) => {
  const text = normalizeText(message);
  return keywords.some((keyword) => text.includes(keyword.toLowerCase()));
};

export const getCreativeSubtypeTags = (message: string): ConversationTag[] => {
  const tags: ConversationTag[] = [];
  const lowered = normalizeText(message);

  Object.entries(CREATIVE_SUBTYPE_TAGS).forEach(([keyword, tag]) => {
    if (lowered.includes(keyword)) {
      tags.push(tag as ConversationTag);
    }
  });

  return tags;
};

/**
 * Broad keyword match — used internally as a building block.
 * NOT suitable for direct classification because it can't distinguish
 * "Who is the director?" from "I am a director".
 */
export const routeMessageByKeyword = (message: string): IntentCategory | null => {
  if (includesAnyKeyword(message, CREATIVE_KEYWORDS)) {
    return "CREATIVE";
  }

  if (includesAnyKeyword(message, PRODUCER_KEYWORDS)) {
    return "PRODUCER";
  }

  if (includesAnyKeyword(message, INVESTOR_KEYWORDS)) {
    return "INVESTOR";
  }

  return null;
};

// ─── Self-Identification Detection ──────────────────────────────────

/**
 * Phrases that indicate the user is talking ABOUT THEMSELVES,
 * not asking a question about the film.
 */
const SELF_ID_PHRASES = [
  // Direct identity statements
  "i am a ",
  "i am an ",
  "i'm a ",
  "i'm an ",
  "im a ",
  "im an ",
  "we are ",
  "i work as ",
  "i work in ",

  // Action-oriented (investing)
  "i want to invest",
  "i'd like to invest",
  "i would like to invest",
  "interested in investing",
  "looking to invest",
  "i want to fund",
  "i want to finance",
  "i'd like to fund",
  "looking to fund",
  "looking to finance",
  "open to investing",
  "interested in funding",
  "like to back",
  "want to back",

  // Action-oriented (producing)
  "we produce",
  "i produce",
  "i've produced",
  "i have produced",

  // Action-oriented (creative)
  "looking to collaborate",
  "i'd like to collaborate",
  "i would like to collaborate",
  "want to collaborate",
  "i'd love to collaborate",
  "interested in collaborating",
  "want to join the project",
  "i'd like to join",
  "love to work on",
  "interested in working on",
];

/**
 * Question words/patterns that strongly indicate the user is
 * asking about the film, NOT identifying themselves.
 */
const QUESTION_PATTERNS = [
  "who is ",
  "who are ",
  "who was ",
  "who directed",
  "who produced",
  "who wrote",
  "who composed",
  "who edited",
  "who's the ",
  "what is ",
  "what are ",
  "what's the ",
  "what was ",
  "where is ",
  "where was ",
  "when is ",
  "when was ",
  "when does ",
  "how is ",
  "how was ",
  "how does ",
  "how much ",
  "is there ",
  "are there ",
  "does the ",
  "did the ",
  "will the ",
  "can you tell me about",
  "tell me about the ",
  "what about the ",
  "i love the ",
  "i liked the ",
  "the film's ",
  "the movie's ",
  "great ",
  "amazing ",
  "beautiful ",
  "incredible ",
];

const isQuestionAboutFilm = (text: string): boolean => {
  const normalized = normalizeText(text);
  // Check for question marks
  if (normalized.includes("?")) return true;
  // Check for question patterns
  return QUESTION_PATTERNS.some((pattern) => normalized.startsWith(pattern) || normalized.includes(pattern));
};

/**
 * Smart professional intent detection.
 * Only triggers when the user is clearly self-identifying or expressing
 * intent to participate professionally. Ignores casual questions about
 * the film even if they contain professional keywords.
 *
 * Examples that SHOULD match:
 *  - "I am a producer" → PRODUCER
 *  - "I want to invest in this" → INVESTOR
 *  - "I'm a director, love this project" → CREATIVE
 *
 * Examples that should NOT match:
 *  - "Who is the director?" → null (general question)
 *  - "What's the budget?" → null (general question)
 *  - "I love the editing in this" → null (fan comment)
 *  - "Tell me about the composer" → null (general question)
 */
export const detectSelfIdentification = (
  message: string
): IntentCategory | null => {
  const text = normalizeText(message);

  // If it looks like a question about the film, don't match
  if (isQuestionAboutFilm(text)) {
    return null;
  }

  // Check if message contains self-identifying language
  const hasSelfId = SELF_ID_PHRASES.some((phrase) => text.includes(phrase));
  if (!hasSelfId) {
    return null;
  }

  // Now check which professional category — investor first (most specific)
  if (includesAnyKeyword(message, INVESTOR_KEYWORDS)) {
    return "INVESTOR";
  }

  if (includesAnyKeyword(message, PRODUCER_KEYWORDS)) {
    return "PRODUCER";
  }

  if (includesAnyKeyword(message, CREATIVE_KEYWORDS)) {
    return "CREATIVE";
  }

  return null;
};

// ─── Producer Branch Detection ───────────────────────────────────────

export const detectProducerBranch = (
  message: string
): "creative" | "financing" | null => {
  const text = normalizeText(message);

  if (
    text.includes("creative") ||
    text.includes("director") ||
    text.includes("actor") ||
    text.includes("actress") ||
    text.includes("filmmaker") ||
    text.includes("cinematographer") ||
    text.includes("dp") ||
    text.includes("composer") ||
    text.includes("editor") ||
    text.includes("production designer") ||
    text.includes("development") ||
    text.includes("packaging") ||
    text.includes("collaborate") ||
    text.includes("collaboration") ||
    text.includes("attach talent") ||
    text.includes("creative producer")
  ) {
    return "creative";
  }

  if (
    text.includes("finance") ||
    text.includes("financing") ||
    text.includes("production") ||
    text.includes("producer") ||
    text.includes("budget") ||
    text.includes("fund")
  ) {
    return "financing";
  }

  return null;
};
