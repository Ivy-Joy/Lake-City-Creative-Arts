// src/controllers/shippingController.js
import ShippingRate from "../models/ShippingRate.js";
import { getShippingRateForAddress } from "../utils/commerceHelpers.js";

/* Admin: create a rate */
export const createRate = async (req, res) => {
  const { name, country = "KE", region, city, price, currency = "KES", active = true } = req.body;
  if (typeof price === "undefined") return res.status(400).json({ message: "price required" });
  const rate = await ShippingRate.create({ name, country, region, city, price, currency, active });
  res.status(201).json(rate);
};

/* Public: list rates */
export const listRates = async (req, res) => {
  const rates = await ShippingRate.find().sort({ country: 1, region: 1, city: 1 });
  res.json(rates);
};

/* Public: calculate shipping for address object in body */
export const calculateShipping = async (req, res) => {
  const { address } = req.body; // { country, region, city }
  if (!address) return res.status(400).json({ message: "address required" });
  const rate = await getShippingRateForAddress(address);
  if (!rate) return res.status(404).json({ message: "No shipping rate found for address" });
  res.json({ shippingFee: rate.price, currency: rate.currency, rateId: rate._id, name: rate.name });
};

/* Admin: update/delete */
export const updateRate = async (req, res) => {
  const { id } = req.params;
  const upd = await ShippingRate.findByIdAndUpdate(id, req.body, { new: true });
  if (!upd) return res.status(404).json({ message: "Shipping Rate Not found" });
  res.json(upd);
};
export const deleteRate = async (req, res) => {
  const { id } = req.params;
  await ShippingRate.findByIdAndDelete(id);
  res.json({ message: "Shipping Rate Deleted" });
};
