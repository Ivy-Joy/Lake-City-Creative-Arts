// backend/src/config/config.js
//env helper - env vars/only for environment variables & constants (port, secrets, URIs, etc.).
import dotenv from "dotenv";
dotenv.config();

const normalize = (u, fallback) => {
  const val = u || fallback;
  try {
    return val.replace(/\/+$/, ""); // drop trailing slashes
  } catch (e) {
    return fallback;
  }
};

const parseNum = (v, fallback) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

// Support either MAILTRAP_* OR generic SMTP_* env names.
// Priority: explicit SMTP_* > MAILTRAP_* > sensible defaults
//This lets us keep our existing .env (with MAILTRAP_* and EMAIL_FROM) - config will pick them up.
const SMTP_HOST = process.env.SMTP_HOST || process.env.MAILTRAP_HOST || "smtp.example.com";
const SMTP_PORT = parseNum(process.env.SMTP_PORT || process.env.MAILTRAP_PORT ,587);
const SMTP_USER = process.env.SMTP_USER || process.env.MAILTRAP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || process.env.MAILTRAP_PASS || "";
const SMTP_FROM = process.env.SMTP_FROM || process.env.MAILTRAP_FROM || "info@lakecitycreativearts.co.ke";
//In config.js, you load env vars once and export them as clean constants:
export default {
  //Core
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",

   //Database
  MONGO_URI: process.env.MONGO_URI,

  //JWT/Auth
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  ACCESS_EXPIRES_IN: process.env.ACCESS_EXPIRES_IN || "15m",
  REFRESH_EXPIRES_IN: process.env.REFRESH_EXPIRES_IN || "7d",

  //Cookies
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || undefined, // e.g. ".yourdomain.com"

  //Frontend (FRONTEND_URL is normalized (no trailing slash) which avoids CORS mismatch)
  FRONTEND_URL: normalize(process.env.FRONTEND_URL || "http://localhost:5173"),
  VERIFICATION_EXPIRES_MIN: parseNum(process.env.VERIFICATION_EXPIRES_MIN, 60),

  // Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || null,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || null,

  // M-PESA
  MPESA_CONSUMER_KEY: process.env.MPESA_CONSUMER_KEY || null,
  MPESA_CONSUMER_SECRET: process.env.MPESA_CONSUMER_SECRET || null,
  MPESA_SHORTCODE: process.env.MPESA_SHORTCODE || null,
  MPESA_PASSKEY: process.env.MPESA_PASSKEY || null,

  // Mailer (exposed canonical names)
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
};



