// src/models/Cart.js
import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  name: String,
  price: Number, // snapshot price in base currency
  quantity: { type: Number, default: 1, min: 1 },
  image: String,
  currency: { type: String, default: "KES "},
}, { _id: false });

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false }, // remove index:true since it is a duplicate, we already have "user":1 on Order.js, null for guest carts
  sessionId: { type: String, index: true }, // optional guest identifier
  items: [cartItemSchema],
  currency: { type: String, default: "KES" },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

cartSchema.index({ user: 1 }, { unique: true, sparse: true }); // one cart per user
export default mongoose.model("Cart", cartSchema);
