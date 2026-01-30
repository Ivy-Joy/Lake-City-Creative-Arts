// src/controllers/productController.js
import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Product from "../models/Product.js";

/**
 * Helpers
 */
const isObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * GET /api/products
 * Queryable list with pagination, category, search, bestseller, price range, stock filter, sort
 * Supports:
 *  ?page=1&limit=20
 *  &category=men
 *  &bestseller=true
 *  &minPrice=100&maxPrice=1000
 *  &inStock=true
 *  &search=shirt
 *  &sortBy=price_desc (or createdAt_asc)
 */
export const getAll = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || "1", 10));
  const limit = Math.min(200, parseInt(req.query.limit || "20", 10));
  const skip = (page - 1) * limit;

  const filter = { isActive: true, deletedAt: null };

  if (req.query.category) filter.category = req.query.category;
  if (req.query.bestseller === "true") filter.bestseller = true;
  if (req.query.inStock === "true") filter.inStock = true;
  if (req.query.minPrice || req.query.maxPrice) {
    filter.price = {};
    if (req.query.minPrice) filter.price.$gte = Number(req.query.minPrice);
    if (req.query.maxPrice) filter.price.$lte = Number(req.query.maxPrice);
  }
  if (req.query.tag) filter.tags = req.query.tag;

  if (req.query.search) {
    // text search fallback
    filter.$text = { $search: req.query.search };
  }

  // sortBy format: field_direction (e.g. price_desc)
  let sort = { createdAt: -1 };
  if (req.query.sortBy) {
    const [field, dir] = req.query.sortBy.split("_");
    sort = { [field]: dir === "asc" ? 1 : -1 };
  }

  const [total, products] = await Promise.all([
    Product.countDocuments(filter),
    Product.find(filter).sort(sort).skip(skip).limit(limit),
  ]);

  res.json({
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
    data: products,
  });
});

/**
 * GET /api/products/:id
 */
export const getOne = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isObjectId(id)) {
    res.status(400);
    throw new Error("Invalid product id");
  }

  const product = await Product.findById(id).populate("owner", "userId firstName lastName email");
  if (!product || product.deletedAt) {
    res.status(404);
    throw new Error("Product not found");
  }

  res.json(product);
});

// normalize incoming images to match ImageSchema: [{ url, alt?, width?, height? }]
const normalizeImages = (imgs) => {
  if (!imgs) return [];
  // If it's already an array, map items
  if (Array.isArray(imgs)) {
    return imgs
      .map((img) => {
        if (!img) return null;
        if (typeof img === "string") return { url: img };
        if (typeof img === "object" && img.url) return img;
        return null;
      })
      .filter(Boolean);
  }
  // Single string or single object
  if (typeof imgs === "string") return [{ url: imgs }];
  if (typeof imgs === "object" && imgs.url) return [imgs];
  return [];
};

/**
 * POST /api/products
 * Protected. Owner set to req.user.id. Admins can create on behalf of others by passing owner.
 */
export const create = asyncHandler(async (req, res) => {
  if (!req.user) {
    res.status(401);
    throw new Error("Not authenticated");
  }

  // Allowed fields
  const {
    name,
    price,
    description,
    images,
    category,
    bestseller = false,
    stock = 0,
    currency,
    variants,
    tags,
    allowBackorder = false,
    shippingEligible = true,
  } = req.body;

  if (!name) {
    res.status(400);
    throw new Error("Product name is required");
  }
  if (typeof price === "undefined" || isNaN(Number(price)) || Number(price) < 0) {
    res.status(400);
    throw new Error("Price must be a non-negative number");
  }

  const owner = req.user.id;

  const product = await Product.create({
    owner,
    name: String(name).trim(),
    price: Number(price),
    currency: currency || undefined,
    description: description || "",
    images: normalizeImages(images),
    category,
    tags: Array.isArray(tags) ? tags : tags ? [tags] : [],
    bestseller: Boolean(bestseller),
    stock: Number(stock),
    allowBackorder: Boolean(allowBackorder),
    shippingEligible: Boolean(shippingEligible),
    variants: Array.isArray(variants) ? variants : [],
  });

  res.status(201).json(product);
});

/**
 * PUT /api/products/:id
 * Protected. Only owner or admin can update.
 */
export const update = asyncHandler(async (req, res) => {
  const { id } = req.params;

  //Validate ObjectId
  if (!isObjectId(id)) {
    res.status(400);
    throw new Error("Invalid product id");
  }

  //Find product
  const product = await Product.findById(id);
  if (!product || product.deletedAt) {
    res.status(404);
    throw new Error("Product not found");
  }

  //Check authentication
  if (!req.user) {
    res.status(401);
    throw new Error("Not authenticated");
  }

  //Check Authorization
  const roles = req.user.roles || [];
  const isAdmin = Array.isArray(roles) ? roles.includes("admin") : roles === "admin";
  if (!isAdmin && product.owner?.toString() !== req.user.id) {
    res.status(403);
    throw new Error("Not allowed to modify this product");
  }

  // Fields allowed to update
  const updatable = [
    "name",
    "price",
    "currency",
    "description",
    "images",
    "category",
    "tags",
    "bestseller",
    "featured",
    "stock",
    "inStock",
    "allowBackorder",
    "shippingEligible",
    "variants",
    "compareAtPrice",
    "isActive",
  ];

  updatable.forEach((f) => {
    if (typeof req.body[f] !== "undefined") {
      //This ensures updates will normalize single-string and array forms into proper { url } objects.
      if (f === "images") {
        //normalize single string or array of strings/objects
        product.images = normalizeImages(req.body.images);
      } else if (f === "tags") {
        //Always force array for tags
        product.tags = Array.isArray(req.body.tags) 
        ? req.body.tags 
        : req.body.tags 
        ? [req.body.tags] 
        : [];
      } else {
        //Assign directly for all other fields
        product[f] = req.body[f];
      }
    }
  });

  // Keep inStock consistent if stock changed
  if (typeof product.stock !== "undefined") {
    product.inStock = product.stock > 0;
  }

  //save updated product
  await product.save();

  res.json({
    success: true,
    message: "Product updated successfully",
    product,
  });
});

/**
 * DELETE /api/products/:id
 * Protected. Soft-delete by default (set deletedAt & isActive=false).
 * If query ?hard=true and user is admin then hard delete.
 */
export const remove = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isObjectId(id)) {
    res.status(400);
    throw new Error("Invalid product id");
  }

  const product = await Product.findById(id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  if (!req.user) {
    res.status(401);
    throw new Error("Not authenticated");
  }

  const roles = req.user.roles || [];
  const isAdmin = Array.isArray(roles) ? roles.includes("admin") : roles === "admin";
  if (!isAdmin && product.owner?.toString() !== req.user.id) {
    res.status(403);
    throw new Error("Not allowed to delete this product");
  }

  const hard = req.query.hard === "true";

  if (hard) {
    if (!isAdmin) {
      res.status(403);
      throw new Error("Hard delete requires admin privileges");
    }
    await product.deleteOne();
    return res.json({ message: "Product permanently deleted" });
  }

  product.deletedAt = new Date();
  product.isActive = false;
  await product.save();
  res.json({ message: "Product archived (soft deleted)" });
});

/**
 * ADMIN: list all (including drafts/deleted) - optional endpoint
 * GET /api/products/admin
 */
export const adminList = asyncHandler(async (req, res) => {
  if (!req.user) {
    res.status(401);
    throw new Error("Not authenticated");
  }
  const roles = req.user.roles || [];
  const isAdmin = Array.isArray(roles) ? roles.includes("admin") : roles === "admin";
  if (!isAdmin) {
    res.status(403);
    throw new Error("Admin access required");
  }

  const page = Math.max(1, parseInt(req.query.page || "1", 10));
  const limit = Math.min(500, parseInt(req.query.limit || "50", 10));
  const skip = (page - 1) * limit;

  const filter = {}; // admins can query anything; add query params as needed
  const [total, products] = await Promise.all([
    Product.countDocuments(filter),
    Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
  ]);

  res.json({
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
    data: products,
  });
});
