// src/validation/product.joi.js
import Joi from "joi";
import M from "../constants/validationMessages.js";

// image: either string URL or object with url required
const imageObject = Joi.object({
  url: Joi.string().trim().required().messages({
    "string.empty": M.IMAGE_OBJECT_URL_REQUIRED,
    "any.required": M.IMAGE_OBJECT_URL_REQUIRED,
  }),
  alt: Joi.string().allow("", null),
  width: Joi.number().optional(),
  height: Joi.number().optional(),
  focalPoint: Joi.object({
    x: Joi.number().optional(),
    y: Joi.number().optional(),
  }).optional(),
});

const imageAlt = Joi.alternatives().try(
  Joi.string().trim().min(1).messages({ "string.empty": M.IMAGE_URL_EMPTY }),
  imageObject
);

const variantSchema = Joi.object({
  sku: Joi.string().optional(),
  title: Joi.string().trim().required().messages({
    "string.empty": M.VARIANT_TITLE_REQUIRED("{idx}"),
    "any.required": M.VARIANT_TITLE_REQUIRED("{idx}"),
  }),
  options: Joi.array().items(
    Joi.object({ name: Joi.string().required(), value: Joi.string().required() })
  ).optional(),
  price: Joi.number().min(0).required().messages({
    "number.base": M.VARIANT_PRICE_INVALID("{idx}"),
    "number.min": M.VARIANT_PRICE_INVALID("{idx}"),
    "any.required": M.VARIANT_PRICE_INVALID("{idx}"),
  }),
  compareAtPrice: Joi.number().min(0).optional(),
  cost: Joi.number().min(0).optional(),
  barcode: Joi.string().optional(),
  images: Joi.array().items(Joi.string().trim()).optional(),
  stock: Joi.number().integer().min(0).optional(),
  stockByLocation: Joi.object().pattern(Joi.string(), Joi.number().integer().min(0)).optional(),
  inStock: Joi.boolean().optional(),
  metadata: Joi.object().optional().unknown(true),
});

export const createProductSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    "string.empty": M.NAME_REQUIRED,
    "any.required": M.NAME_REQUIRED,
  }),
  price: Joi.number().required().min(0).messages({
    "number.base": M.PRICE_INVALID,
    "number.min": M.PRICE_INVALID,
    "any.required": M.PRICE_REQUIRED,
  }),
  currency: Joi.string().optional(),
  shortDescription: Joi.string().max(300).optional().messages({
    "string.max": M.SHORT_DESC_TOO_LONG,
  }),
  description: Joi.string().max(1000).optional().messages({
    "string.max": M.DESCRIPTION_TOO_LONG,
  }),
  category: Joi.string().optional(),
  subcategory: Joi.string().optional(),
  brand: Joi.string().optional(),
  tags: Joi.array().items(Joi.string().trim().min(1)).optional().messages({
    "array.base": M.TAGS_MUST_ARRAY,
  }),
  stock: Joi.number().integer().min(0).optional().messages({
    "number.base": M.STOCK_INVALID,
    "number.min": M.STOCK_INVALID,
  }),
  stockByLocation: Joi.object().pattern(Joi.string(), Joi.number().integer().min(0)).optional(),
  inStock: Joi.boolean().optional(),
  allowBackorder: Joi.boolean().optional(),
  images: Joi.alternatives().try(imageAlt, Joi.array().items(imageAlt)).optional().messages({
    "alternatives.match": M.IMAGE_SHAPE_INVALID,
  }),
  gallery: Joi.array().items(Joi.string().trim()).optional(),
  thumbnail: Joi.string().optional(),
  hasVariants: Joi.boolean().optional(),
  variants: Joi.array().items(variantSchema).optional(),
  weightKg: Joi.number().min(0).optional().messages({ "number.min": M.WEIGHT_INVALID }),
  dimensions: Joi.object({
    lengthCm: Joi.number().min(0).optional().messages({ "number.min": M.DIMENSION_INVALID("lengthCm") }),
    widthCm: Joi.number().min(0).optional().messages({ "number.min": M.DIMENSION_INVALID("widthCm") }),
    heightCm: Joi.number().min(0).optional().messages({ "number.min": M.DIMENSION_INVALID("heightCm") }),
  }).optional(),
  bestseller: Joi.boolean().optional(),
  featured: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(),
  metadata: Joi.object().optional().unknown(true),
}).unknown(true); // allow other fields like owner, sku if they come through

// Update schema: same as create but make top-level keys optional (partial updates)
export const updateProductSchema = createProductSchema.fork(
  Object.keys(createProductSchema.describe().keys),
  (schema) => schema.optional()
);
