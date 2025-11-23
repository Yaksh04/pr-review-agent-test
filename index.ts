// SWE_project_website/server/index.ts

import express from "express";
import cors from "cors";
import session from "express-session";

import authRouter from "./auth.js";
import { registerRoutes } from "./routes.js";

const app = express();

/* IMPORTANT: tell Express it's behind a proxy (Railway) so secure cookies work */
app.set("trust proxy", 1);

/* ------------------------------------------------------
   FRONTEND URL (hardcoded)
------------------------------------------------------ */
const FRONTEND_URL = "https://pull-panda-a3s8.vercel.app";

/* ------------------------------------------------------
   CORS — allow cookies from Vercel
------------------------------------------------------ */
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

/* ------------------------------------------------------
   SESSION — NO ENV — WORKS ON RAILWAY + VERCEL
------------------------------------------------------ */
app.use(
  session({
    secret: "supersecret",      // hardcoded, as you want
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,       // MUST be true for Railway HTTPS
      sameSite: "none",   // Required for cross-domain cookies
      path: "/",
    },
  })
);

/* ------------------------------------------------------
   BODY PARSERS
------------------------------------------------------ */
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

/* ------------------------------------------------------
   ROUTES
------------------------------------------------------ */
app.use("/api/auth", authRouter);

(async () => {
  await registerRoutes(app);

  app.get("/", (_req, res) => {
    res.json({ status: "Backend running on Railway" });
  });

  const port = parseInt(process.env.PORT || "5000", 10);
  app.listen(port, "0.0.0.0", () => {
    console.log(`🚀 Backend running on port ${port}`);
  });
})();
