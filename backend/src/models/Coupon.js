// src/models/Coupon.js
import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, uppercase: true, unique: true },
  description: String,
  type: { type: String, enum: ["percentage","flat"], required: true },
  value: { type: Number, required: true }, // percentage (10) or flat (100)
  currency: { type: String, default: "KES" },
  startsAt: Date,
  expiresAt: Date,
  usageLimit: Number, // total uses across all users
  perUserLimit: Number, // uses per user
  active: { type: Boolean, default: true },
  minOrderAmount: Number,
  appliedCount: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model("Coupon", couponSchema);
