// SWE_project_website/server/index.ts

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import session from "express-session";
import authRouter from "./auth.js";
import { registerRoutes } from "./routes.js";

const app = express();

/* -----------------------
   🔥 HARD-CODED CONSTANTS
-------------------------- */

const FRONTEND_URL = "https://pull-panda-a3s8.vercel.app";

// Required for cookies
const SESSION_SECRET = "supersecret-session-string";

/* ----------------------
   🔥 CORS
------------------------- */
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

/* ----------------------
   🔥 SESSION CONFIG
------------------------- */
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,      // Railway is HTTPS → MUST be true
      sameSite: "none",  // Cross-site cookies → MUST be none
      path: "/",
    },
  })
);

console.log("COOKIE SETTINGS:", {
  secure: true,
  sameSite: "none",
});

/* ----------------------
   BODY PARSING
------------------------- */
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

/* ----------------------
   ROUTES
------------------------- */
app.use("/api/auth", authRouter);

/* Additional API routes */
(async () => {
  await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    res.status(err.status || 500).json({ message: err.message });
  });

  app.get("/", (_req, res) => {
    res.json({ status: "Backend running", env: "HARD-CODED" });
  });

  const port = parseInt(process.env.PORT || "8080", 10);
  app.listen(port, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${port}`);
  });
})();
