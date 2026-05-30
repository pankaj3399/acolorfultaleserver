import mongoose from "mongoose";
import dotenv from "dotenv";
import db from "../models";
dotenv.config();

const MONGO_URL: string = process.env.MONGO_URL || "mongodb://localhost:27017/demo";

/**
 * Cached connection promise for serverless environments.
 * Prevents creating a new connection on every cold/warm invocation.
 */
let cachedConnection: Promise<typeof mongoose> | null = null;

export const connectDB = async (): Promise<void> => {
  // If already connected, skip
  if (mongoose.connection.readyState === 1) {
    return;
  }

  // If a connection is already in progress, wait for it
  if (cachedConnection) {
    await cachedConnection;
    return;
  }

  try {
    cachedConnection = mongoose.connect(MONGO_URL);

    await cachedConnection;
    await ensureDefaultAdmin();
    console.log("DB Connected Successfully....");
  } catch (err) {
    cachedConnection = null;
    console.log("DB Connection Failed!");
    console.error(err);
    // In serverless, don't call process.exit — throw so the request fails gracefully
    throw err;
  }
};

const ensureDefaultAdmin = async () => {
  const existingAdmin = await db.admin.findOne({ username: "admin" });
  if (existingAdmin) {
    return;
  }

  await db.admin.create({
    username: process.env.ADMIN_USERNAME || "admin",
    password: process.env.ADMIN_PASSWORD || "admin",
  });
};

export default connectDB;
