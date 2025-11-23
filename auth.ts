// // SWE_project_website/server/auth.ts
// import dotenv from "dotenv";
// dotenv.config(); // MUST be first

// import express, { Request, Response } from "express";
// import axios from "axios";
// import { Octokit } from "@octokit/rest";
// import session from "express-session";
// import { GITHUB_CLIENT_ID } from "./config/env.js";

// declare module "express-session" {
//   interface SessionData {
//     accessToken?: string;
//   }
// }

// const router = express.Router();

// console.log("AUTH ENV TEST:", process.env.GITHUB_CLIENT_ID, process.env.GITHUB_REDIRECT_URI);

// /* ------------------------------------------------------
//    STEP 1 — LOGIN ROUTE
//    Forces GitHub to prompt login + consent every time.
// -------------------------------------------------------- */
// router.get("/github", (_req: Request, res: Response) => {
//   const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
//   const REDIRECT_URI = process.env.GITHUB_REDIRECT_URI;

//   if (!CLIENT_ID || !REDIRECT_URI) {
//     return res.status(500).send("GitHub OAuth is not configured.");
//   }

//   const authUrl =
//     `https://github.com/login/oauth/authorize` +
//     `?client_id=${CLIENT_ID}` +
//     `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
//     `&scope=repo,user` +
//     `&prompt=consent` +
//     `&force_verify=true`;  // <--- THE KEY FIX

//   res.redirect(authUrl);
// });

// /* ------------------------------------------------------
//    STEP 2 — CALLBACK ROUTE
//    GitHub sends ?code=XYZ → we exchange it for access token
// -------------------------------------------------------- */
// router.get("/github/callback", async (req: Request, res: Response) => {
//   const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
//   const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
//   const REDIRECT_URI = process.env.GITHUB_REDIRECT_URI;
//   const FRONTEND_URL = process.env.FRONTEND_URL;

//   if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI || !FRONTEND_URL) {
//     console.error("❌ Missing OAuth ENV vars in callback");
//     return res.status(500).send("OAuth configuration incomplete.");
//   }

//   const code = req.query.code as string;

//   if (!code) {
//     console.error("❌ OAuth Callback Error: Missing code");
//     return res.status(400).send("Missing 'code' parameter from GitHub OAuth.");
//   }

//   try {
//     const tokenResponse = await axios.post(
//       "https://github.com/login/oauth/access_token",
//       {
//         client_id: CLIENT_ID,
//         client_secret: CLIENT_SECRET,
//         code,
//         redirect_uri: REDIRECT_URI
//       },
//       { headers: { Accept: "application/json" } }
//     );

//     const accessToken = tokenResponse.data.access_token;

//     if (!accessToken) {
//       console.error("❌ Failed to exchange OAuth code:", tokenResponse.data);
//       return res.status(401).send("GitHub OAuth token exchange failed.");
//     }

//     // Save token in session
//     req.session.accessToken = accessToken;

//     console.log("✔ OAuth success — redirecting to frontend:", FRONTEND_URL);
//     return res.redirect(FRONTEND_URL);

//   } catch (err) {
//     console.error("❌ OAuth callback exchange failed:", err);
//     return res.status(500).send("GitHub OAuth failed during token exchange.");
//   }
// });

// /* ------------------------------------------------------
//    STEP 3 — CHECK AUTH STATE
//    Used by ProtectedRoute (frontend)
// -------------------------------------------------------- */
// router.get("/me", async (req: Request, res: Response) => {
//   if (!req.session.accessToken) {
//     return res.status(401).json({ error: "Not authenticated" });
//   }

//   try {
//     const octokit = new Octokit({ auth: req.session.accessToken });
//     const { data: user } = await octokit.rest.users.getAuthenticated();
//     return res.json(user);

//   } catch (err) {
//     console.error("❌ Token invalid — clearing session:", err);
//     delete req.session.accessToken;
//     return res.status(401).json({ error: "Token invalid, please log in again." });
//   }
// });

// /* ------------------------------------------------------
//    STEP 4 — LOGOUT
// -------------------------------------------------------- */
// router.post("/logout", (req: Request, res: Response) => {
//   req.session.destroy(() => {
//     res.clearCookie("connect.sid", {
//       path: "/",
//       sameSite: "none",
//       secure: false
//     });
//     console.log("✔ Logged out successfully.");
//     return res.json({ message: "Logged out" });
//   });
// });

// export default router;


// SWE_project_website/server/auth.ts
import express from "express";
import axios from "axios";
import { Octokit } from "@octokit/rest";

const router = express.Router();

/* ------------------------------------------------------
   HARDCODED CONSTANTS
------------------------------------------------------ */
const BACKEND_URL = "https://pr-review-agent-test-production-5d0a.up.railway.app";
const FRONTEND_URL = "https://pull-panda-a3s8.vercel.app";

// 🔥 USE YOUR REAL OAuth App values here:
const GITHUB_CLIENT_ID = "Ov23liYe2zHfm9WetpmF";
const GITHUB_CLIENT_SECRET = "34cabc07212ee78642c2671e0b7de06b01213136";

/* ------------------------------------------------------
   LOGIN → GITHUB
------------------------------------------------------ */
router.get("/github", (_req, res) => {
  const url =
    `https://github.com/login/oauth/authorize` +
    `?client_id=${GITHUB_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(`${BACKEND_URL}/api/auth/github/callback`)}` +
    `&scope=repo,user` +
    `&prompt=consent&force_verify=true`;

  res.redirect(url);
});

/* ------------------------------------------------------
   GITHUB CALLBACK
------------------------------------------------------ */
router.get("/github/callback", async (req, res) => {
  const code = req.query.code as string;

  if (!code) return res.status(400).send("Missing code.");

  try {
    const tokenRes = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${BACKEND_URL}/api/auth/github/callback`,
      },
      { headers: { Accept: "application/json" } }
    );

    const accessToken = tokenRes.data.access_token;

    if (!accessToken) {
      console.log("Token exchange failed:", tokenRes.data);
      return res.status(500).send("OAuth failed.");
    }

    // Save token in session
    (req.session as any).accessToken = accessToken;

    // 🔥 FIX: Redirect through backend to ensure cookie is saved
    return res.redirect(`${BACKEND_URL}/api/auth/redirect`);
  } catch (err) {
    console.error(err);
    return res.status(500).send("OAuth failed.");
  }
});

/* ------------------------------------------------------
   BRIDGE REDIRECT — REQUIRED to persist cookie
------------------------------------------------------ */
router.get("/redirect", (req, res) => {
  // Cookie is now stored, safe to redirect
  res.redirect(FRONTEND_URL);
});

/* ------------------------------------------------------
   GET USER
------------------------------------------------------ */
router.get("/me", async (req, res) => {
  const token = (req.session as any).accessToken;

  if (!token) return res.status(401).json({ error: "Not authenticated" });

  try {
    const octokit = new Octokit({ auth: token });
    const { data: user } = await octokit.rest.users.getAuthenticated();
    return res.json(user);
  } catch (err) {
    console.log(err);
    return res.status(401).json({ error: "Invalid token" });
  }
});

/* ------------------------------------------------------
   LOGOUT
------------------------------------------------------ */
router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid", {
      path: "/",
      secure: true,
      sameSite: "none",
    });
    res.json({ message: "Logged out" });
  });
});

export default router;
