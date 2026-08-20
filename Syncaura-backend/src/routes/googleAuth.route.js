import express from "express";
import { google } from "googleapis";
import { auth } from "../middlewares/auth.js";
import pool from "../config/db.js";
import jwt from "jsonwebtoken";

const router = express.Router();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// console.log("GOOGLE_CLIENT_ID =", process.env.GOOGLE_CLIENT_ID);

// console.log("GOOGLE_CLIENT_SECRET =", process.env.GOOGLE_CLIENT_SECRET);

// console.log("GOOGLE_REDIRECT_URI =http://localhost:5000/auth/google/callback", process.env.GOOGLE_REDIRECT_URI);

router.get("/google", auth, async (req, res) => {
  try {
    const state = jwt.sign(
      { id: req.user.id },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "10m" }
    );

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: [
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
      ],
      state,
    });

    return res.redirect(authUrl);
  } catch (error) {
    console.error("Google OAuth Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to start Google OAuth",
    });
  }
});

// Step 1: Generate Google auth URL
router.get("/google/callback", async (req, res) => {
  try {
    const { code, state } = req.query;

    console.log("=== Google OAuth Callback Triggered ===");
    console.log("Query parameters:", { code: !!code, state: !!state });

    if (!code) {
      console.error("OAuth Error: Authorization code missing");
      return res.status(400).json({
        success: false,
        message: "Authorization code missing",
      });
    }

    if (!state) {
      console.error("OAuth Error: State token missing");
      return res.status(400).json({
        success: false,
        message: "State token missing",
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(state, process.env.JWT_ACCESS_SECRET);
      console.log("State token verified successfully. User ID:", decoded.sub || decoded.id);
    } catch (err) {
      console.error("JWT Verification failed for state parameter:", err.message);
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    console.log("Exchanging auth code for tokens using redirect URI:", process.env.GOOGLE_REDIRECT_URI);
    const { tokens } = await oauth2Client.getToken(code);
    
    console.log("Tokens received from Google:", {
      access_token: tokens.access_token ? "PRESENT" : "NULL",
      refresh_token: tokens.refresh_token ? "PRESENT" : "NULL",
      scope: tokens.scope,
      expiry_date: tokens.expiry_date,
    });
    
    oauth2Client.setCredentials(tokens);

    const targetUserId = decoded.sub || decoded.id;
    console.log("Updating database user tokens for user ID:", targetUserId);

    const dbResult = await pool.query(
      `UPDATE users SET 
        google_access_token = $1, 
        google_refresh_token = $2, 
        google_scope = $3, 
        google_token_type = $4, 
        google_expiry_date = $5,
        updated_at = CURRENT_TIMESTAMP 
      WHERE id = $6`,
      [
        tokens.access_token,
        tokens.refresh_token,
        tokens.scope,
        tokens.token_type,
        tokens.expiry_date,
        targetUserId,
      ]
    );

    console.log("Database update complete. Rows affected:", dbResult.rowCount);

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    return res.redirect(`${clientUrl}/meetings?google_connected=true`);
  } catch (error) {
    console.error("OAuth callback error:", error);

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    return res.redirect(`${clientUrl}/meetings?error=${encodeURIComponent(error.message || "Google OAuth failed")}`);
  }
});

// Step 2: Callback after Google OAuth approval
// router.get("/google/callback", async (req, res) => {
//   try {
//     const { code, state } = req.query;
//     if (!code || !state) return res.status(400).json({ message: "Authorization code missing" });

//     const decoded = jwt.verify(state, process.env.JWT_ACCESS_SECRET);

//     const { tokens } = await oauth2Client.getToken(code);
//     oauth2Client.setCredentials(tokens);

//     // Update user with tokens
//     await pool.query(
//       `UPDATE users SET 
//         google_access_token = $1, 
//         google_refresh_token = $2, 
//         google_scope = $3, 
//         google_token_type = $4, 
//         google_expiry_date = $5,
//         updated_at = CURRENT_TIMESTAMP 
//       WHERE id = $6`,
//       [
//         tokens.access_token,
//         tokens.refresh_token,
//         tokens.scope,
//         tokens.token_type,
//         tokens.expiry_date,
//         decoded.sub || decoded.id
//       ]
//     );

//     res.status(200).json({
//       success: true,
//       message: "Google connected successfully",
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Google OAuth failed" });
//   }
// });

export default router;
