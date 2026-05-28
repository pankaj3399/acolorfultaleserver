import mongoose, { Document, Schema } from "mongoose";
import {
  ConversationDocumentShape,
  ConversationStatus,
  ConversationTag,
  IntentCategory,
  MessageRecord,
} from "../types";

export interface IConversation extends ConversationDocumentShape, Document {
  currentFlow: IntentCategory | null;
  tags: ConversationTag[];
  messages: MessageRecord[];
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

const conversationSchema = new Schema<IConversation>(
  {
    userId: { type: String, required: true, index: true },
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
  {
    timestamps: true,
  }
);

conversationSchema.index({ profileType: 1 });
conversationSchema.index({ classificationSource: 1 });
conversationSchema.index({ status: 1 });
conversationSchema.index({ createdAt: -1 });
conversationSchema.index({ tags: 1 });

export default mongoose.model<IConversation>("Conversation", conversationSchema);
