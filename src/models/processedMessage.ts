import mongoose, { Document, Schema } from "mongoose";

export interface IProcessedMessage extends Document {
  mid: string;
  createdAt: Date;
}

const processedMessageSchema = new Schema<IProcessedMessage>(
  {
    mid: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now, expires: 600 },
  },
  { versionKey: false }
);

export default mongoose.model<IProcessedMessage>(
  "ProcessedMessage",
  processedMessageSchema
);
