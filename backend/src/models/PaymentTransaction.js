// src/models/PaymentTransaction.js
import mongoose from "mongoose";

/**
 * PaymentTransaction: records every payment attempt with provider metadata and raw provider responses.
 * IMPORTANT: store amounts in smallest currency units where possible (e.g., cents) to avoid float issues.
 */
const PaymentTransactionSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    provider: { type: String, required: true }, // 'mpesa' | 'stripe' | 'paypal' | 'none'
    providerTxId: { type: String }, // provider transaction id or receipt
    idempotencyKey: { type: String, index: true }, // for safe retries
    amount: { type: Number, required: true }, // smallest unit (e.g., KES as whole units here — be consistent)
    currency: { type: String, required: true, default: "KES" },
    status: { type: String, enum: ["initiated", "pending", "succeeded", "failed", "refunded"], default: "initiated" },
    methodDetails: { type: mongoose.Schema.Types.Mixed, default: {} }, // phone, checkoutRequestId, card brand...
    raw: { type: mongoose.Schema.Types.Mixed }, // raw provider response for audit
    error: { type: String }, // human-friendly error reason if failed
  },
  { timestamps: true }
);

export default mongoose.model("PaymentTransaction", PaymentTransactionSchema);
