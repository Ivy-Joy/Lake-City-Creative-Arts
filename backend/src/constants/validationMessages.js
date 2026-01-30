// src/constants/validationMessages.js
const M = {
  // Core
  NAME_REQUIRED: "Product 'name' is required and must be a non-empty string",
  PRICE_REQUIRED: "Product 'price' is required",
  PRICE_INVALID: "Product 'price' must be a non-negative number",
  STOCK_INVALID: "Product 'stock' must be a non-negative integer",
  CATEGORY_INVALID: "Product 'category' must be a string",
  SHORT_DESC_TOO_LONG: "Short description cannot exceed 300 characters",
  DESCRIPTION_TOO_LONG: "Description cannot exceed 1000 characters",

  // Images
  IMAGE_URL_EMPTY: "Image URL cannot be empty",
  IMAGE_OBJECT_URL_REQUIRED: "Image object must have a non-empty 'url' string",
  IMAGE_SHAPE_INVALID: "Each image must be a string URL or an object with at least a 'url' property",

  // Tags
  TAGS_MUST_ARRAY: "Tags must be an array of strings",
  TAGS_NON_EMPTY: "Tags must only contain non-empty strings",

  // Variants
  VARIANTS_MUST_ARRAY: "Variants must be a non-empty array when hasVariants = true",
  VARIANT_MUST_OBJECT: (idx) => `Variant at index ${idx} must be an object`,
  VARIANT_TITLE_REQUIRED: (idx) => `Variant at index ${idx} must have a non-empty 'title'`,
  VARIANT_PRICE_INVALID: (idx) => `Variant at index ${idx} must have a valid non-negative 'price'`,
  VARIANT_STOCK_INVALID: (idx) => `Variant at index ${idx} 'stock' must be a non-negative integer`,

  // Dimensions & weight
  DIMENSION_INVALID: (dim) => `Dimension '${dim}' must be a non-negative number`,
  WEIGHT_INVALID: "Weight must be a non-negative number",

  // Generic
  PRODUCT_VALIDATION_FAILED: "Product validation failed",
};

export default M;
