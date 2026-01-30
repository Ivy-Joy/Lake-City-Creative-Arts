// src/controllers/orderController.js
import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";

/**
 * Helper: compute shipping fee (stub — replace with business logic)
 * Example: Kisumu CBD = 100 KES, other Kenyan counties = 300 KES, international = 1500 KES
 * Accepts shippingAddress object (with city/country)
 */
function computeShippingFee(shippingAddress) {
  if (!shippingAddress) return 0;
  const country = (shippingAddress.country || "Kenya").toLowerCase();
  const city = (shippingAddress.city || "").toLowerCase();

  if (country !== "kenya" && country !== "kenya".toLowerCase()) {
    // international
    return 1500 * 100; // if using cents, adapt; here assume same unit as prices
  }

  // local within Kenya
  if (city.includes("kisumu")) return 100;
  return 300;
}

/**
 * POST /api/orders
 * Create an order:
 * - items: [{ productId, quantity }]
 * - shippingAddress: object
 * - payment.provider (optional)
 *
 * Strict flow:
 * 1. Validate payload
 * 2. Start transaction
 * 3. For each item: check stock and decrement atomically
 * 4. Build order items snapshot (name, unitPrice)
 * 5. Create order document
 * 6. Commit
 */
export const createOrder = asyncHandler(async (req, res) => {
  if (!req.user || !req.user.id) {
    res.status(401);
    throw new Error("Not authenticated");
  }

  const { items: rawItems, shippingAddress, billingAddress, payment = {} } = req.body;
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    res.status(400);
    throw new Error("Order must include items");
  }

  // Normalize and validate items
  const normalized = rawItems.map((it) => ({
    productId: it.productId || it.product || it._id,
    quantity: Number(it.quantity || it.qty || 1)
  }));

  if (normalized.some(i => !mongoose.Types.ObjectId.isValid(i.productId) || !Number.isFinite(i.quantity) || i.quantity <= 0)) {
    res.status(400);
    throw new Error("Invalid items payload");
  }

  // Start a session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Load products (for price snapshot) -- lock documents for write via for-update pattern
    const productIds = normalized.map(i => i.productId);
    const products = await Product.find({ _id: { $in: productIds } }).session(session);

    const prodMap = new Map(products.map(p => [p._id.toString(), p]));

    // Reserve stock atomically (each update part of the transaction)
    for (const it of normalized) {
      const p = prodMap.get(it.productId.toString());
      if (!p) {
        throw new Error(`Product not found: ${it.productId}`);
      }
      if (p.stock < it.quantity) {
        throw new Error(`Not enough stock for product ${p.name}`);
      }

      // decrement stock
      p.stock -= it.quantity;
      if (p.stock <= 0) p.inStock = false;
      await p.save({ session });
    }

    // Build order item snapshots & calculate subtotal
    const itemsSnapshot = normalized.map((it) => {
      const p = prodMap.get(it.productId.toString());
      return {
        product: p._id,
        name: p.name,
        sku: p.sku,
        quantity: it.quantity,
        unitPrice: p.price // ensure price stored in your money unit policy (cents vs float)
      };
    });

    const subTotal = itemsSnapshot.reduce((s, it) => s + (Number(it.unitPrice) * Number(it.quantity)), 0);
    const shippingFee = computeShippingFee(shippingAddress);
    const taxTotal = 0; // compute taxes here if needed
    const discountTotal = 0; // apply coupon logic in controller before this step if needed
    const total = Math.max(0, subTotal + shippingFee + taxTotal - discountTotal);

    // Create order
    const order = new Order({
      user: req.user.id,
      items: itemsSnapshot,
      subTotal,
      shippingFee,
      taxTotal,
      discountTotal,
      total,
      currency: payment.currency || "KES",
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      payment: {
        provider: payment.provider || "none",
        status: payment.status || "pending",
        amount: total,
        currency: payment.currency || "KES",
        raw: payment.raw || {}
      },
      status: "pending",
      metadata: req.body.metadata || {}
    });

    await order.save({ session });

    // commit transaction
    await session.commitTransaction();
    session.endSession();

    res.status(201).json(order);
  } catch (err) {
    // abort transaction -> product changes will be rolled back
    await session.abortTransaction();
    session.endSession();
    // bubble up error
    res.status(res.statusCode && res.statusCode !== 200 ? res.statusCode : 400);
    throw err;
  }
});

/**
 * GET /api/orders/mine
 * List orders for authenticated user (paginated)
 */
export const getMyOrders = asyncHandler(async (req, res) => {
  if (!req.user || !req.user.id) {
    res.status(401);
    throw new Error("Not authenticated");
  }

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;

  const [total, orders] = await Promise.all([
    Order.countDocuments({ user: req.user.id }),
    Order.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("items.product", "name sku") // optional
  ]);

  res.json({
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
    data: orders
  });
});

/**
 * GET /api/orders/:id
 * Get a single order (owner or admin)
 */
export const getOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid order id");
  }

  const order = await Order.findById(id).populate("items.product");
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  // allow owner or admin
  const isOwner = String(order.user) === String(req.user?.id);
  const isAdmin = Array.isArray(req.user?.roles) ? req.user.roles.includes("admin") : req.user?.roles === "admin";

  if (!isOwner && !isAdmin) {
    res.status(403);
    throw new Error("Not allowed");
  }

  res.json(order);
});

/**
 * PATCH /api/orders/:id/cancel
 * Cancel an order (owner only, only pending or processing depending on rules)
 * Restores stock (inside a transaction)
 */
export const cancelMyOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid order id");
  }

  const order = await Order.findById(id);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  // only owner can cancel
  if (String(order.user) !== String(req.user?.id)) {
    res.status(403);
    throw new Error("Not your order");
  }

  // you may choose which statuses are cancellable
  if (!["pending", "paid", "processing"].includes(order.status)) {
    res.status(400);
    throw new Error("Only pending/processing orders can be cancelled");
  }

  // Start transaction
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // restore stock
    const bulkOps = order.items.map(i => ({
      updateOne: {
        filter: { _id: i.product },
        update: { $inc: { stock: i.quantity }, $set: { inStock: true } }
      }
    }));

    if (bulkOps.length) {
      await Product.bulkWrite(bulkOps, { session });
    }

    order.status = "cancelled";
    if (order.payment) order.payment.status = "failed";
    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json(order);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(500);
    throw err;
  }
});

/**
 * --- Admin endpoints ---
 */

/**
 * GET /api/admin/orders
 * Admin: list all orders (paginated + filters)
 */
export const adminList = asyncHandler(async (req, res) => {
  // Authorization should be handled by middleware (adminOnly)
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(200, parseInt(req.query.limit) || 50);
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.user) filter.user = req.query.user;
  if (req.query.orderNumber) filter.orderNumber = req.query.orderNumber;

  const [total, orders] = await Promise.all([
    Order.countDocuments(filter),
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("items.product")
  ]);

  res.json({
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
    data: orders
  });
});

/**
 * PATCH /api/admin/orders/:id/status
 * Admin: update status (processing, shipped, delivered, cancelled)
 * If admin cancels, restore stock
 */
export const adminUpdateStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const allowed = ["processing", "shipped", "delivered", "cancelled", "refunded"];
  if (!allowed.includes(status)) {
    res.status(400);
    throw new Error("Invalid status");
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid order id");
  }

  const order = await Order.findById(id);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  const prevStatus = order.status;

  // Use transaction if changing stock (cancellation)
  if (status === "cancelled" && prevStatus !== "cancelled") {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      // restore stock
      const bulkOps = order.items.map(i => ({
        updateOne: {
          filter: { _id: i.product },
          update: { $inc: { stock: i.quantity }, $set: { inStock: true } }
        }
      }));
      if (bulkOps.length) {
        await Product.bulkWrite(bulkOps, { session });
      }

      order.status = status;
      if (order.payment) order.payment.status = "failed";
      await order.save({ session });

      await session.commitTransaction();
      session.endSession();

      return res.json(order);
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      res.status(500);
      throw err;
    }
  }

  // simple status update path (no stock changes)
  order.status = status;
  if (status === "delivered") order.fulfillment = order.fulfillment || {};
  await order.save();

  res.json(order);
});
