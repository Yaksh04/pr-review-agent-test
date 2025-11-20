import dotenv from "dotenv";
dotenv.config();

export const {
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  GITHUB_REDIRECT_URI,
  FRONTEND_URL,
  SESSION_SECRET
} = process.env;
