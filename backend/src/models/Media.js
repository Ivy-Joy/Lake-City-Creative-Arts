// src/models/Media.js
import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema({
  url: { type: String, required: true },
  key: String, // storage key if using S3
  alt: String,
  title: String,
  size: Number,
  mimeType: String,
  width: Number,
  height: Number,
  ownerModel: String, // "Product" or "User" etc.
  ownerId: mongoose.Schema.Types.ObjectId,
  order: Number
}, { timestamps: true });

export default mongoose.model("Media", mediaSchema);
