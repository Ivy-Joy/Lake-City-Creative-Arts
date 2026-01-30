// src/routes/paymentRoutes.js
import express from "express";
import { body } from "express-validator";
import validate from "../middleware/validate.js";
import * as ctrl from "../controllers/paymentController.js";

const router = express.Router();

// Create payment transaction (client picks provider but server enforces amount)
router.post(
  "/",
  [
    body("orderId").notEmpty().withMessage("orderId required"),
    body("provider").optional().isString(),
  ],
  validate,
  ctrl.createTransaction
);

// Webhook endpoints
// - M-Pesa posts JSON (can remain express.json)
router.post("/webhook/mpesa", express.json(), ctrl.mpesaWebhook);

// - Stripe requires raw body for signature validation; we'll wire this route *in app.js* with express.raw
// (See instructions below for app.js wiring)

// Get tx
router.get("/:id", ctrl.getTransaction);

export default router;
