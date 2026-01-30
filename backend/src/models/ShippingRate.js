// src/models/ShippingRate.js
import mongoose from "mongoose";

const shippingRateSchema = new mongoose.Schema({
    name: { type: String, required: true }, // descriptive e.g. "Kisumu CBD"
    country: { type: String, required: true, default: "KE" }, // ISO or country name
    region: { type: String }, // e.g., county or "CBD"
    city: { type: String },
    price: { type: Number, required: true }, // amount in store base currency
    currency: { type: String, default: "KES" },
    active: { type: Boolean, default: true },
//   postalCode: String,
//   minWeight: Number,
//   maxWeight: Number,
}, { timestamps: true });

export default mongoose.model("ShippingRate", shippingRateSchema);
