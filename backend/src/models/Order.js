// src/models/Order.js
import mongoose from "mongoose";
import Counter from "./Counter.js";
import Product from "./Product.js";

/**
 * Recommendation:
 * - For money, prefer integer cents (e.g., priceInCents) to avoid floating point rounding.
 * - If you use decimals, use mongoose.Types.Decimal128 and be careful converting to/from numbers.
 */

const OrderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true }, // reference for lookups
    name: { type: String, required: true },     // snapshot: product name at time of purchase
    sku: { type: String },                      // optional snapshot SKU
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 }, // store in smallest currency unit (e.g., cents) OR use decimal
    // You can also store taxRate, variant info, attributes, etc.
  },
  { _id: false }
);

const AddressSchema = new mongoose.Schema(
  {
    fullName: String,
    phone: String,
    company: String,
    line1: { type: String, required: true },
    line2: String,
    city: String,
    state: String,
    postalCode: String,
    country: { type: String, default: "Kenya" },
  },
  { _id: false }
);

const PaymentSchema = new mongoose.Schema(
  {
    provider: { type: String, enum: ["stripe", "mpesa", "paypal", "cod", "none"], default: "none" },
    status: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
    currency: { type: String, required: true, default: "KES" },
    amount: { type: Number, required: true, min: 0 }, // in cents or smallest unit
    transactionId: String,           // provider's id (payment_intent, mpesa id, etc)
    raw: mongoose.Schema.Types.Mixed // store raw provider response if needed
  },
  { _id: false, timestamps: true }
);

const FulfillmentSchema = new mongoose.Schema(
  {
    provider: String,          // e.g., "DHL", "Local Rider"
    trackingNumber: String,
    status: { 
      type: String, 
      enum: ["pending", "ready", "shipped", "in_transit", "out_for_delivery", "delivered", "cancelled"], 
      default: "pending" 
    },
    shippedAt: Date,
    deliveredAt: Date,
    estimatedDelivery: Date,
    notes: String
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String }, // no uique: true, index: true here e.g. ORD-2025-0001
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    items: { type: [OrderItemSchema], required: true },

    // price breakdown (all in the same units as payment.amount)
    subTotal: { type: Number, required: true, min: 0 },   // sum(unitPrice * quantity)
    shippingFee: { type: Number, required: true, default: 0 },
    taxTotal: { type: Number, required: true, default: 0 },
    discountTotal: { type: Number, required: true, default: 0 },

    total: { type: Number, required: true, min: 0 }, // subTotal + shipping + tax - discount

    currency: { type: String, required: true, default: "KES" },
    // Optional: store fx rate if you show prices in other currencies
    exchangeRate: { type: Number }, // (optional) relative to base currency

    shippingAddress: { type: AddressSchema, required: true },
    billingAddress: { type: AddressSchema },

    payment: { type: PaymentSchema, required: true },

    status: {
      type: String,
      enum: ["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"],
      default: "pending"
    },

    fulfillment: { type: FulfillmentSchema },

    notes: String,
    metadata: mongoose.Schema.Types.Mixed, // arbitrary metadata (coupons, channel, campaign, etc.)

    // soft-delete flag
    archived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

/**
 * Auto-generate an orderNumber like ORD-2025-0001
 * Use a Counter collection to keep sequential counters per year/namespace.
 */
orderSchema.pre("save", async function (next) {
  if (!this.isNew) return next();

  try {
    const year = new Date().getFullYear();
    const counter = await Counter.findOneAndUpdate(
      { name: `order-${year}` },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    this.orderNumber = `ORD-${year}-${String(counter.seq).padStart(6, "0")}`;
    next();
  } catch (err) {
    next(err);
  }
});

/**
 * Instance helper: compute totals from items + shipping/tax/discount
 * Use this in controllers prior to saving an order (or call before save)
 */
orderSchema.methods.computeTotals = function () {
  const subTotal = this.items.reduce((s, it) => s + (Number(it.unitPrice) * Number(it.quantity)), 0);
  const shipping = Number(this.shippingFee || 0);
  const tax = Number(this.taxTotal || 0);
  const discount = Number(this.discountTotal || 0);
  const total = subTotal + shipping + tax - discount;
  this.subTotal = Math.max(0, Math.round(subTotal));
  this.total = Math.max(0, Math.round(total));
  return { subTotal: this.subTotal, shipping: this.shippingFee, tax: this.taxTotal, discount: this.discountTotal, total: this.total };
};

/**
 * Instance helper: mark as paid (optionally accept provider data).
 * Prefer calling within a transaction and updating payment.status simultaneously.
 */
orderSchema.methods.markPaid = async function ({ transactionId, providerResponse } = {}) {
  this.payment.status = "paid";
  if (transactionId) this.payment.transactionId = transactionId;
  if (providerResponse) this.payment.raw = providerResponse;
  this.status = this.status === "pending" ? "paid" : this.status;
  await this.save();
  return this;
};

/**
 * Instance helper: cancel order and optionally restore stock.
 * Restoring stock must be done carefully (within a transaction ideally).
 * You can pass `restoreStock: true` to increment product.stock by item.quantity.
 */
orderSchema.methods.cancel = async function ({ restoreStock = false, session = null } = {}) {
  this.status = "cancelled";
  this.payment.status = "failed";
  await this.save({ session });

  if (restoreStock) {
    // Note: use updateMany or bulkWrite for efficiency
    const ops = this.items.map((it) => ({
      updateOne: {
        filter: { _id: it.product },
        update: { $inc: { stock: it.quantity }, $set: { inStock: true } },
      },
    }));

    if (ops.length) {
      await Product.bulkWrite(ops, { session });
    }
  }

  return this;
};

/**
 * Indexes
 */
//only one index definition needed
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 }, { unique: true }); //it centralizes all indexes at the bottom of the file.
//It's cleaner and avoids surprises when scanning field definitions.

export default mongoose.model("Order", orderSchema);
