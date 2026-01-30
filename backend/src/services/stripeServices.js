import config from "../config/config.js";
import Stripe from "stripe";

const isProd = config.NODE_ENV === "production";
// In dev, you can keep a dummy client to avoid real API calls.
const stripe = config.STRIPE_SECRET_KEY ? new Stripe(config.STRIPE_SECRET_KEY) : null;

export async function createCheckoutSession({ lineItems, customerEmail, successUrl, cancelUrl }) {
  if (!isProd || !stripe) {
    // Dev stub: pretend a session was created
    return { id: "cs_test_stub", url: `${config.FRONTEND_URL}/checkout/success` };
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: lineItems,
    customer_email: customerEmail,
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session;
}

// Verify webhook signature (prod). In dev we'll trust it.
export function constructEventFromPayload(signature, payloadBuffer) {
  if (!isProd || !config.STRIPE_WEBHOOK_SECRET || !stripe) {
    return {
      type: "checkout.session.completed",
      data: { object: { id: "cs_test_stub", payment_intent: "pi_test_stub" } },
    };
  }

  return stripe.webhooks.constructEvent(payloadBuffer, signature, config.STRIPE_WEBHOOK_SECRET);
}
