import mongoose, { Document, Schema } from "mongoose";
import { IntentCategory, MessageRecord, ConversationStatus, ConversationTag } from "../types";

export interface IInstagramConversation extends Document {
  /** Instagram-scoped user ID (sender) */
  instagramUserId: string;
  /** Instagram page/account ID that received the message */
  instagramPageId: string;
  currentFlow: IntentCategory | null;
  messageStep: number;
  tags: ConversationTag[];
  capturedData: {
    email?: string;
    phone?: string;
  };
  messages: MessageRecord[];
  profileType: "professional" | "fan" | null;
  classificationSource: "keyword" | "gemini" | "fallback";
  status: ConversationStatus;
}

const messageSchema = new Schema<MessageRecord>(
  {
    sender: { type: String, enum: ["user", "assistant"], required: true },
    text: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
    step: { type: Number },
    delayMs: { type: Number },
    quickReplies: { type: [String], default: undefined },
  },
  { _id: false }
);

const instagramConversationSchema = new Schema<IInstagramConversation>(
  {
    instagramUserId: { type: String, required: true, index: true },
    instagramPageId: { type: String, required: true, index: true },
    currentFlow: {
      type: String,
      enum: ["INVESTOR", "PRODUCER", "CREATIVE", "GENERAL", null],
      default: null,
    },
    messageStep: { type: Number, default: 0 },
    tags: { type: [String], default: [] },
    capturedData: {
      email: { type: String, default: undefined },
      phone: { type: String, default: undefined },
    },
    messages: { type: [messageSchema], default: [] },
    profileType: {
      type: String,
      enum: ["professional", "fan", null],
      default: null,
    },
    classificationSource: {
      type: String,
      enum: ["keyword", "gemini", "fallback"],
      default: "fallback",
    },
    status: {
      type: String,
      enum: ["ACTIVE", "WAITING_FOR_CONTACT", "COMPLETED"],
      default: "ACTIVE",
    },
  },
  { timestamps: true }
);

// Compound index: one active conversation per IG user per page
instagramConversationSchema.index(
  { instagramUserId: 1, instagramPageId: 1 },
  { unique: true }
);
instagramConversationSchema.index({ status: 1 });
instagramConversationSchema.index({ createdAt: -1 });

export default mongoose.model<IInstagramConversation>(
  "InstagramConversation",
  instagramConversationSchema
);
