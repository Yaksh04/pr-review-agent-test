// SWE_project_website/server/index.ts

import express from "express";
import cors from "cors";
import session from "express-session";
import MongoStore from "connect-mongo";

import authRouter from "./auth.js";
import { registerRoutes } from "./routes.js";

const app = express();

/* ------------------------------------------------------
   IMPORTANT: TRUST PROXY (required for Railway HTTPS)
------------------------------------------------------ */
app.set("trust proxy", 1);

/* ------------------------------------------------------
   FRONTEND URL (hardcoded)
------------------------------------------------------ */
const FRONTEND_URL = "https://pull-panda-yaksh.vercel.app";

/* ------------------------------------------------------
   MONGODB SESSION STORE
------------------------------------------------------ */

// TODO: replace with your actual MongoDB connection string
const MONGO_URI =
  "mongodb+srv://princechovatiya01_db_user:Prince123%4045@cluster0.k4iubg9.mongodb.net/sessionsDB?retryWrites=true&w=majority&appName=Cluster0";
/* ------------------------------------------------------
   CORS (allow cross-domain cookies)
------------------------------------------------------ */
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

/* ------------------------------------------------------
   SESSION (persistent using MongoDB)
------------------------------------------------------ */
app.use(
  session({
    secret: "supersecret", // your hard-coded secret
    resave: false,
    saveUninitialized: false,

    store: MongoStore.create({
      mongoUrl: MONGO_URI,
      collectionName: "sessions",
      ttl: 14 * 24 * 60 * 60, // 14 days
    }),

    cookie: {
      httpOnly: true,
      secure: true, // REQUIRED for HTTPS (Railway)
      sameSite: "none", // REQUIRED for Vercel ↔ Railway cookies
      path: "/",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days login persistence
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
