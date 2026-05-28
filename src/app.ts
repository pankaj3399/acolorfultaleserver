import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db";
import routes from "./routes";
import { errorConverter, errorHandler } from "./middleware/error";
import cors from "cors";
import { ASSISTANT_DEFAULT_MESSAGE } from "./config/assistant";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

// Middleware to ensure DB connection on every request (serverless-safe)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("DB connection failed:", err);
    res.status(500).json({ error: "Database connection failed" });
  }
});

app.get("/", (req, res) => {
  res.json({
    name: "AI-GENT 001",
    message: ASSISTANT_DEFAULT_MESSAGE,
    status: "ok",
  });
});

app.get("/test", (req, res) => {
  res.send("hello world");
});

app.use("/api", routes);

app.use(errorConverter);

app.use(errorHandler);

// Default export for Vercel (detected automatically at src/app.ts)
export default app;

// Local development server — only runs when executed directly
if (require.main === module) {
  const port = Number(process.env.PORT) || 4000;
  connectDB().then(() => {
    app.listen(port, () => {
      console.log(`Express is listening at http://localhost:${port}`);
    });
  });
}
