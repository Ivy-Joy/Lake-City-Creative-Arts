// src/app.js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import compression from "compression"; //compression is a small Express middleware that gzips responses (saves bandwidth, speeds up response times).

import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import shippingRoutes from "./routes/shippingRoutes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

import config from "./config/config.js";


const app = express();

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    const allowed = [config.FRONTEND_URL, "http://127.0.0.1:5173"];
    return cb(null, allowed.includes(origin));
  },
  credentials: true,
};


// CORS: allow only trusted frontend(s).
//Locked down to FRONTEND_URL (instead of allowing anyone).
// Change in .env for different environments (development, staging, production)

//allows cors globally(preflight and regualr requests)
app.use(cors(corsOptions));

//ensure OPTIONS pre-flight responds quickly
//app.options("*", cors(corsOptions));

// GLOBAL MIDDLEWARES
app.use(helmet()); // adds security headers (XSS, Clickjacking, MIME sniffing protection).
app.use(express.json({ limit: "10kb" })); //GLOBAL JSON parser for most routes. Prevent/blocks large/huge payloads attacks
app.use(cookieParser()); // Enable httpOnly,Secure, SameSite refresh tokens
app.use(compression()); // reduces payload size Gzip compression for responses
app.use(morgan(config.NODE_ENV === "production" ? "combined" : "dev")); //in prod -logs IPs, request method,
//  response codes/status, user agent etc. for better analysis.
// logging. In local/dev, use 'dev' format. In production, use 'combined'.

app.use("/api/cart", cartRoutes);
app.use("/api/shipping", shippingRoutes);

// ROUTES
app.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "API is running",
    environment: config.NODE_ENV || "development",
  });
});

// Authentication (login, register, reset password, verify email)
app.use("/api/auth", authRoutes);

// Products (catalog, details, admin CRUD)
app.use("/api/products", productRoutes);

// Orders (cart, checkout, user orders, admin management)
app.use("/api/orders", orderRoutes);

// Mount payment routes and integrations (MPESA, Stripe, PayPal etc. Mpesa uses webhook uses express.json inside router)
app.use("/api/payments", paymentRoutes);

// Stripe webhook - MUST use raw body so signature check works
// Mount it BEFORE any body parser that would consume the body
// If your app.use(express.json()) is global, you can add this specific route AFTER, but
// the specific express.raw middleware here will override body parsing for this path.
// app.post(
//   "/api/payments/webhook/stripe",
//   express.raw({ type: "application/json" }), // raw buffer
//   paymentController.stripeWebhook
// );

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message });
});

//ERROR HANDLING
app.use(notFound);       // 404 handler. notFound - Must be after all routes. Catches undefined/unhandled routes.
app.use(errorHandler);   // Centralized errorHandler - structured JSON error responses

export default app;

// Scalability and maintainability
// Environment-based configs (process.env.NODE_ENV).
// Modular route organization.