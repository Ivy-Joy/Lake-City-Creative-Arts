// src/models/InventoryTransaction.js
import mongoose from "mongoose";

const invSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
  change: { type: Number, required: true }, // positive for restock, negative for sale
  reason: { type: String, enum: ["order","adjustment","return","import","other"], default: "other" },
  referenceId: String, // e.g. order id
  meta: Object,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" } // admin user who made the change
}, { timestamps: true });

export default mongoose.model("InventoryTransaction", invSchema);
