// SWE_project_website/server/index.ts

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import session from "express-session";

import authRouter from "./auth.js";
import { registerRoutes } from "./routes.js";

const app = express();

/* ------------------------------------------------------
   FRONTEND URL — Update if needed
--------------------------------------------------------- */
const FRONTEND_URL = "https://pull-panda-a3s8.vercel.app"; // Vercel frontend

/* ------------------------------------------------------
   CORS CONFIG (VERY IMPORTANT)
--------------------------------------------------------- */
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true, // allow cookies
  })
);

/* ------------------------------------------------------
   SESSION CONFIG — ONLY HERE (not inside auth.ts)
--------------------------------------------------------- */
app.use(
  session({
    secret: "supersecret", // your hardcoded session secret
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,              // because Railway uses HTTPS
      sameSite: "none",          // required for cross-site cookies
      path: "/",                 // allow all routes to access cookie
    },
  })
);

/* ------------------------------------------------------
   BODY PARSERS
--------------------------------------------------------- */
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

/* ------------------------------------------------------
   AUTH ROUTES (MUST MATCH THE REDIRECT)
   auth.ts expects: /api/auth/*
--------------------------------------------------------- */
app.use("/api/auth", authRouter);

/* ------------------------------------------------------
   API ROUTES (your project routes)
--------------------------------------------------------- */
(async () => {
  await registerRoutes(app);

  /* ------------------------------------------------------
     ERROR HANDLER
  --------------------------------------------------------- */
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(err.status || 500).json({ message: err.message });
  });

  /* ------------------------------------------------------
     HEALTH CHECK (for Railway)
  --------------------------------------------------------- */
  app.get("/", (_req, res) => {
    res.json({ status: "Backend running on Railway", env: "production" });
  });

  /* ------------------------------------------------------
     START SERVER
  --------------------------------------------------------- */
  const port = parseInt(process.env.PORT || "5000", 10);
  app.listen(port, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${port}`);
  });
})();
