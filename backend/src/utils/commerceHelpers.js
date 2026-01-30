// src/utils/commerceHelpers.js
//this is a stub for dev. To be replaced with a reliable exchange-rate provider and caching for production
import ShippingRate from "../models/ShippingRate.js";

/**
 * Find best shipping rate for an address object: { country, region, city }.
 * Priority:
 *  - exact city + region + country
 *  - region + country
 *  - country default
 *  - null if not found
 */
export async function getShippingRateForAddress(address) {
  if (!address) return null;
  const { country = "KE", region, city } = address;

  // try most specific
  if (city) {
    const r1 = await ShippingRate.findOne({ country, city: new RegExp(`^${escapeReg(city)}$`, "i"), active: true });
    if (r1) return r1;
  }
  if (region) {
    const r2 = await ShippingRate.findOne({ country, region: new RegExp(`^${escapeReg(region)}$`, "i"), active: true });
    if (r2) return r2;
  }
  const r3 = await ShippingRate.findOne({ country, region: null, city: null, active: true });
  if (r3) return r3;
  return null;
}

function escapeReg(s){ return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

/**
 * Simple currency convert stub. In prod replace with a real rates provider and caching.
 * `rates` map is base currency KES -> { USD: 0.0075 ... } or whatever you want.
 */
const rates = {
  KES: { KES: 1, USD: 0.0075, EUR: 0.0068 },
  USD: { USD: 1, KES: 134, EUR: 0.91 },
};

export function convertAmount(amount, from = "KES", to = "KES") {
  if (from === to) return amount;
  const rFrom = rates[from] || {};
  const factor = rFrom[to] ?? (rates["KES"][to] ?? 1);
  return Math.round((amount * factor) * 100) / 100;
}

//Note: This is a stub for dev. Replace with  a relaible exchange-rate provider and caching for production.