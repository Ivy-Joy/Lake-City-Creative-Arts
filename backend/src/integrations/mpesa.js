// src/integrations/mpesa.js
//import fetch from "node-fetch"; // or axios
import qs from "querystring";

const isSandbox = (process.env.MPESA_ENV || "sandbox") === "sandbox";

/**
 * NOTE: this wrapper is minimal and written for clarity.
 * Replace with SDK or finished client for production (add retries, error handling, logging).
 */

const baseUrl = isSandbox
  ? "https://sandbox.safaricom.co.ke"
  : "https://api.safaricom.co.ke";

async function getAccessToken() {
  const key = process.env.MPESA_CONSUMER_KEY;
  const secret = process.env.MPESA_CONSUMER_SECRET;
  const b64 = Buffer.from(`${key}:${secret}`).toString("base64");

  const resp = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${b64}` },
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error("Mpesa auth failed: " + text);
  }
  const json = await resp.json();
  return json.access_token;
}

/**
 * STK Push (Lipa Na M-Pesa Online)
 * - amount: number
 * - phone: in format 2547XXXXXXX
 * - accountReference: string
 * - callbackUrl: URL (your webhook)
 */
async function stkPush({ amount, phone, accountReference, callbackUrl }) {
  const token = await getAccessToken();
  // Build password (Base64 of shortcode + passkey + timestamp) — adjust to your MPESA implementation
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14); // example timestamp; provider expects a specific format
  const password = Buffer.from(shortcode + passkey + timestamp).toString("base64");

  const payload = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: amount,
    PartyA: phone, // customer
    PartyB: shortcode, // merchant
    PhoneNumber: phone,
    CallBackURL: callbackUrl,
    AccountReference: accountReference,
    TransactionDesc: `Payment for ${accountReference}`,
  };

  // sandbox: endpoint path differs; adjust as necessary for production
  const endpoint = isSandbox
    ? `${baseUrl}/mpesa/stkpush/v1/processrequest`
    : `${baseUrl}/mpesa/stkpush/v1/processrequest`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error("Mpesa STK push failed: " + txt);
  }

  const json = await res.json();
  // Example response includes CheckoutRequestID and MerchantRequestID
  return json;
}

/**
 * For production: implement verifyCallback(payload) to validate signatures (if provider supplies).
 */
function verifyMpesaCallbackForDev(payload) {
  // In sandbox, there's often no signature. For production, validate according to docs.
  return true;
}

export const mpesaClient = { getAccessToken, stkPush, verifyMpesaCallbackForDev };
