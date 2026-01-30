// src/controllers/paymentController.js
import asyncHandler from "express-async-handler";
import PaymentTransaction from "../models/PaymentTransaction.js";
import Order from "../models/Order.js";
import { mpesaClient } from "../integrations/mpesa.js";
//import Stripe from "stripe";

//const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * POST /api/payments
 * Body: { orderId, provider = 'mpesa'|'stripe'|'none', phone?, idempotencyKey? }
 *
 * This endpoint ENFORCES server-side amount: the DB order total is authoritative.
 */
export const createTransaction = asyncHandler(async (req, res) => {
  const { orderId, provider = "mpesa", phone, idempotencyKey } = req.body;

  if (!orderId) return res.status(400).json({ message: "orderId required" });

  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ message: "Order not found" });

  if (!["pending", "failed"].includes(order.status)) {
    return res.status(400).json({ message: "Order not payable in its current status" });
  }

  // Use server-computed amount. IMPORTANT: be consistent with units.
  const amount = Number(order.total);
  const currency = order.currency || "KES";

  // Idempotency: if transaction exists with same idempotencyKey and final state, return it
  if (idempotencyKey) {
    const existing = await PaymentTransaction.findOne({ order: orderId, provider, idempotencyKey });
    if (existing) {
      return res.status(200).json({ tx: existing, note: "idempotent result" });
    }
  }

  // Create transaction record
  const tx = await PaymentTransaction.create({
    order: orderId,
    provider,
    amount,
    currency,
    status: "initiated",
    idempotencyKey,
  });

  // Provider-specific flows
  if (provider === "none") {
    // Dev stub: mark succeeded immediately if call from trusted admin/dev
    tx.status = "succeeded";
    tx.providerTxId = `dev-${tx._id}`;
    tx.raw = { note: "dev accepted" };
    await tx.save();

    // mark order paid
    order.payment = { amount, currency, provider: "none", status: "paid", transactionId: tx._id };
    order.status = "paid";
    await order.save();

    return res.status(201).json(tx);
  }

  if (provider === "mpesa") {
    if (!phone) return res.status(400).json({ message: "phone required for mpesa" });

    // initiate STK push
    try {
      const stk = await mpesaClient.stkPush({
        amount,
        phone,
        accountReference: order.orderNumber || orderId,
        callbackUrl: process.env.MPESA_CALLBACK_URL || `${process.env.BASE_URL}/api/payments/webhook/mpesa`,
      });

      // store provider-specific ids
      tx.status = "pending";
      tx.methodDetails = {
        checkoutRequestId: stk.CheckoutRequestID || stk.checkoutRequestID || null,
        merchantRequestId: stk.MerchantRequestID || null,
        phone,
      };
      tx.raw = stk;
      await tx.save();

      return res.status(200).json({ txId: tx._id, checkoutRequestId: tx.methodDetails.checkoutRequestId });
    } catch (err) {
      tx.status = "failed";
      tx.error = err.message;
      tx.raw = { error: err.message };
      await tx.save();
      return res.status(500).json({ message: "Mpesa initiation failed", detail: err.message });
    }
  }

  // if (provider === "stripe") {
  //   // Create Stripe PaymentIntent with exact amount server-side
  //   try {
  //     // stripe expects amount in smallest currency unit (e.g., cents), adapt if required
  //     const pi = await stripe.paymentIntents.create({
  //       amount: Math.round(amount), // adapt if storing cents
  //       currency: currency.toLowerCase(),
  //       metadata: { orderId: String(orderId), paymentTransactionId: String(tx._id) },
  //     });

  //     tx.status = "pending";
  //     tx.methodDetails = { stripePaymentIntentId: pi.id };
  //     tx.raw = pi;
  //     await tx.save();

  //     // return client_secret for front-end to complete payment
  //     return res.status(200).json({ clientSecret: pi.client_secret, txId: tx._id });
  //   } catch (err) {
  //     tx.status = "failed";
  //     tx.error = err.message;
  //     tx.raw = err;
  //     await tx.save();
  //     return res.status(500).json({ message: "Stripe initiation failed", detail: err.message });
  //   }
  // }

  return res.status(400).json({ message: "Unsupported provider" });
});

/**
 * POST /api/payments/webhook/mpesa
 * M-Pesa callback (as configured in the STK push)
 * Validate and update transaction & order.
 */
export const mpesaWebhook = asyncHandler(async (req, res) => {
  const payload = req.body; // provider will POST JSON
  // Basic validation (production: validate signature or confirm merchant id)
  if (!mpesaClient.verifyMpesaCallbackForDev(payload)) {
    return res.status(400).json({ ok: false });
  }

  // Example M-Pesa callback structure (stkCallback)
  const stk = payload.Body?.stkCallback;
  if (!stk) {
    return res.status(400).json({ ok: false, message: "Invalid mpesa callback" });
  }

  const checkoutRequestId = stk.CheckoutRequestID || null;
  const resultCode = stk.ResultCode;
  const callbackMetadata = stk.CallbackMetadata || {}; // contains Items array on success

  // find transaction by checkoutRequestId
  const tx = await PaymentTransaction.findOne({ "methodDetails.checkoutRequestId": checkoutRequestId });
  if (!tx) {
    // Could be a callback for unknown tx - respond ok to provider to stop retries, but log it.
    console.warn("mpesa callback for unknown checkoutRequestId", checkoutRequestId);
    return res.json({ ok: true });
  }

  // Idempotency: ignore if already final
  if (["succeeded", "failed"].includes(tx.status)) return res.json({ ok: true });

  if (resultCode === 0) {
    // parse callback metadata items to get Amount and MpesaReceiptNumber
    const items = callbackMetadata?.Item || [];
    const amountObj = items.find((i) => i.Name === "Amount" || i.name === "Amount");
    const receiptObj = items.find((i) => /MpesaReceiptNumber/i.test(i.Name || i.name));

    const paidAmount = amountObj ? Number(amountObj.Value || amountObj.value) : tx.amount;
    const receipt = receiptObj ? (receiptObj.Value || receiptObj.value) : null;

    // Verify amounts match expected
    if (Number(paidAmount) !== Number(tx.amount)) {
      tx.status = "failed";
      tx.error = `Amount mismatch: expected ${tx.amount} got ${paidAmount}`;
      tx.raw = payload;
      await tx.save();
      // optionally alert ops
      return res.status(400).json({ ok: false, message: "Amount mismatch" });
    }

    // success
    tx.status = "succeeded";
    tx.providerTxId = receipt || checkoutRequestId;
    tx.methodDetails.mpesaReceipt = receipt;
    tx.raw = payload;
    await tx.save();

    // update order
    const order = await Order.findById(tx.order);
    order.payment = { amount: tx.amount, currency: tx.currency, provider: "mpesa", status: "paid", transactionId: tx._id };
    order.status = "paid";
    await order.save();

    return res.json({ ok: true });
  }

  // non-zero result => failed / cancelled
  tx.status = "failed";
  tx.raw = payload;
  tx.error = `Mpesa result code ${resultCode}`;
  await tx.save();
  return res.json({ ok: true });
});

/**
 * POST /api/payments/webhook/stripe
 * Stripe requires the raw body middleware so signature can be verified.
 * In app.js we will wire this route to use express.raw({type:'application/json'}) before this handler.
 */
// export const stripeWebhook = async (req, res) => {
//   // In this handler, expect raw body (Buffer) and header stripe-signature
//   const sig = req.headers["stripe-signature"];
//   const rawBody = req.body; // raw body as Buffer (express.raw)
//   let event;
//   try {
//     event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
//   } catch (err) {
//     console.error("Stripe webhook signature verification failed:", err.message);
//     return res.status(400).send(`Webhook Error: ${err.message}`);
//   }

//   // handle event types
//   if (event.type === "payment_intent.succeeded") {
//     const pi = event.data.object;
//     const metadata = pi.metadata || {};
//     const orderId = metadata.orderId;
//     const txId = metadata.paymentTransactionId;

//     // find transaction by txId or stripePaymentIntentId
//     let tx = null;
//     if (txId) tx = await PaymentTransaction.findById(txId);
//     if (!tx) tx = await PaymentTransaction.findOne({ "methodDetails.stripePaymentIntentId": pi.id });

//     if (!tx) {
//       console.warn("Stripe webhook: tx not found", pi.id);
//       return res.json({ received: true });
//     }

//     // verify amount
//     const received = Number(pi.amount_received || pi.amount);
//     // adapt units — if you store whole units, convert; here assume same units
//     if (received !== Number(tx.amount)) {
//       tx.status = "failed";
//       tx.error = `Amount mismatch: expected ${tx.amount}, stripe ${received}`;
//       tx.raw = pi;
//       await tx.save();
//       return res.status(400).send("Amount mismatch");
//     }

//     tx.status = "succeeded";
//     tx.providerTxId = pi.id;
//     tx.methodDetails.stripePaymentIntentId = pi.id;
//     tx.raw = pi;
//     await tx.save();

//     // update order
//     const order = await Order.findById(tx.order);
//     order.payment = { amount: tx.amount, currency: tx.currency, provider: "stripe", status: "paid", transactionId: tx._id };
//     order.status = "paid";
//     await order.save();
//   }

//   // return 200 for all handled events
//   res.json({ received: true });
// };

/**
 * GET /api/payments/:id
 */
export const getTransaction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tx = await PaymentTransaction.findById(id);
  if (!tx) return res.status(404).json({ message: "Not found" });
  res.json(tx);
});

/**
 * Optional admin refund endpoint (not implemented fully)...
 * Implement provider refund calls and create RefundTransaction records.
 */
