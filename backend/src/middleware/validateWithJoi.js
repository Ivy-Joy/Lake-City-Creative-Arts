// src/middleware/validateWithJoi.js
import M from "../constants/validationMessages.js";

/**
 * validateWithJoi(schema)
 * Returns middleware that validates req.body with the given Joi schema.
 * Options:
 *  - abortEarly: false by default so we return all errors
 */
export const validateWithJoi = (schema, { abortEarly = false } = {}) => async (req, res, next) => {
  try {
    const { error, value } = schema.validate(req.body, { abortEarly, allowUnknown: true });
    if (!error) {
      req.body = value; // sanitized/typed result
      return next();
    }

    // Map Joi error details to friendly messages using M where possible
    const messages = mapJoiErrors(error.details);
    return res.status(400).json({
      success: false,
      message: M.PRODUCT_VALIDATION_FAILED,
      errors: messages,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * mapJoiErrors(details)
 * Convert Joi error details -> array of readable messages
 * Prefer M constants when path/type match known fields; otherwise use detail.message
 */
const mapJoiErrors = (details) => {
  const msgs = [];

  for (const d of details) {
    const path = Array.isArray(d.path) ? d.path.join(".") : String(d.path);
    const type = d.type; // e.g. "string.empty", "number.min"

    // Top-level field
    const top = d.path && d.path.length ? d.path[0] : null;

    // Prefer central messages for common fields
    if (top === "name") {
      msgs.push(M.NAME_REQUIRED);
      continue;
    }
    if (top === "price") {
      // if required missing or invalid price
      msgs.push(M.PRICE_INVALID);
      continue;
    }
    if (top === "stock") {
      msgs.push(M.STOCK_INVALID);
      continue;
    }
    if (top === "images") {
      // Use generic image messages if applicable
      if (type.startsWith("alternatives") || type.startsWith("string")) {
        msgs.push(M.IMAGE_SHAPE_INVALID);
      } else {
        msgs.push(M.IMAGE_OBJECT_URL_REQUIRED);
      }
      continue;
    }
    if (top === "tags") {
      msgs.push(M.TAGS_NON_EMPTY);
      continue;
    }
    if (top === "variants" || top === "variants.title" || top === "variants.price") {
      // fallback to Joi message if we don't have exact mapping
      // but try to use variant-specific constants where useful
      if (type.includes("required") || type.includes("empty")) {
        msgs.push(M.VARIANT_TITLE_REQUIRED(typeof d.path[1] === "number" ? d.path[1] : "{idx}"));
      } else {
        msgs.push(M.VARIANT_PRICE_INVALID(typeof d.path[1] === "number" ? d.path[1] : "{idx}"));
      }
      continue;
    }

    // Dimensions / weight
    if (top === "dimensions") {
      const last = d.path[d.path.length - 1];
      msgs.push(M.DIMENSION_INVALID(last));
      continue;
    }
    if (top === "weightKg") {
      msgs.push(M.WEIGHT_INVALID);
      continue;
    }

    // Fallback: original Joi message (clean it a bit)
    msgs.push(d.message.replace(/["']/g, ""));
  }

  // dedupe
  return [...new Set(msgs)];
};

//schema.validate(req.body, { allowUnknown: true }) ensures we don't reject fields 
// like owner or sku passed by admin flows. Set to false if you want strict checking.
// abortEarly: false is the default inside middleware to gather all errors — good for frontend UX.