// src/routes/productRoutes.js
import express from "express";
import { protect, adminOnly } from "../middleware/auth.js";
import * as ctrl from "../controllers/productController.js";
import { validateWithJoi } from "../middleware/validateWithJoi.js";
import { createProductSchema, updateProductSchema } from "../validation/product.joi.js";


const router = express.Router();

/**
 * PUBLIC
 */
// GET /api/products?page=1&limit=20&search=...
router.get("/", ctrl.getAll);

/**
 * Admin-only routes
 * Admin-only list (static route must come BEFORE /:id)
 */
// GET /api/products/admin  -> list everything (including drafts/deleted)
router.get("/admin/list", protect, adminOnly, ctrl.adminList);

/**
 * PUBLIC - product detail (param route after static routes)
 */
// GET /api/products/:id
router.get("/:id", ctrl.getOne);

/**
 * PROTECTED (owner or admin) - create/update/delete
 */
// POST /api/products
// Create (Joi validation)
router.post("/", 
  protect, 
  validateWithJoi(createProductSchema, 
    { abortEarly: false }), 
    ctrl.create
);

// PUT /api/products/:id
// Update (Joi partial validation)
router.put("/:id", 
  protect, 
  validateWithJoi(updateProductSchema, 
    { abortEarly: false }), 
    ctrl.update
);

// DELETE /api/products/:id
router.delete("/:id", protect, ctrl.remove);

export default router;
