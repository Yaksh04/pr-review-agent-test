// SWE_project_website/server/index.ts
// MUST BE THE FIRST LINES — BEFORE ANY OTHER IMPORT
console.log("RUNNING BUILD VERSION:", new Date().toISOString());
console.log("HELLO_TEST:", process.env.HELLO_TEST);

import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import session from "express-session";

import authRouter from "./auth.js";
import { registerRoutes } from "./routes.js";

const app = express();

/* ---------------------- CORS ----------------------- */
app.use(
  cors({
    origin: "http://localhost:3000", // frontend
    credentials: true,
  })
);

/* --------------------- SESSION ---------------------- */
app.use(
  session({
    secret: "supersecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Railway free tier = NOT HTTPS
      sameSite: "lax",
      path: "/",
    },
  })
);

/* --------------------- BODY PARSING ---------------------- */
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

/* ---------------------- AUTH ROUTES ---------------------- */
// 🔥 MUST match redirect URL inside auth.ts
app.use("/api/auth", authRouter);

/* ---------------------- OTHER API ROUTES ---------------------- */
(async () => {
  await registerRoutes(app);

  // Error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    res.status(err.status || 500).json({ message: err.message });
  });

  // Root check for Railway
  app.get("/", (_req, res) => {
    res.json({ status: "Backend running", env: "production" });
  });

  // Start server
  const port = parseInt(process.env.PORT || "5000", 10);
  app.listen(port, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${port}`);
  });
})();


