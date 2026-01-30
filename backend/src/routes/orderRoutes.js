// src/routes/orderRoutes.js
import { Router } from "express";
import { body, param } from "express-validator";
import validate from "../middleware/validate.js";
import { protect, adminOnly } from "../middleware/auth.js";
import {
  createOrder,
  getMyOrders,
  getOrder,
  cancelMyOrder,
  adminList,
  adminUpdateStatus,
} from "../controllers/orderController.js";

const router = Router();

/**
 * Admin endpoints
 */

// GET /api/orders/admin
// List all orders (admin)
router.get("/admin", protect, adminOnly, adminList);


// PATCH /api/orders/admin/:id/status
// Update order status (admin)
router.patch(
  "/admin/:id/status",
  protect,
  adminOnly,
  [
    param("id").isMongoId().withMessage("Invalid order id"),
    body("status")
      .isIn(["processing", "shipped", "delivered", "cancelled"])
      .withMessage("Invalid status"),
  ],
  validate,
  adminUpdateStatus
);

/**
 * Public / Protected order endpoints
 */

// POST /api/orders
// Create an order (protected)
router.post(
  "/",
  protect,
  [
    body("items")
      .isArray({ min: 1 })
      .withMessage("Order must contain at least one item"),
    body("items.*.productId")
      .isMongoId()
      .withMessage("Each item must contain a valid productId"),
    body("items.*.quantity")
      .isInt({ min: 1 })
      .withMessage("Each item must have a quantity >= 1"),
    body("shippingAddress").notEmpty().withMessage("Shipping address is required"),
    body("shippingAddress.city").notEmpty().withMessage("Shipping city is required"),
    body("shippingAddress.country").notEmpty().withMessage("Shipping country is required"),
    body("displayCurrency")
      .optional()
      .isLength({ min: 3, max: 3 })
      .withMessage("displayCurrency must be a 3-letter currency code"),
  ],
  validate,
  createOrder
);


// GET /api/orders/mine
// Get logged-in user's orders
router.get("/mine", protect, getMyOrders);

// GET /api/orders/:id
// Get specific order (owner or admin)
router.get(
  "/:id",
  protect,
  [param("id").isMongoId().withMessage("Invalid order id")],
  validate,
  getOrder
);

// PATCH /api/orders/:id/cancel
// Cancel owner's pending order
router.patch(
  "/:id/cancel",
  protect,
  [param("id").isMongoId().withMessage("Invalid order id")],
  validate,
  cancelMyOrder
);

export default router;

/**
 * Define more specific routes before the dynamic /:id route.
So in orderRoutes.js, move your admin routes above the /:id route.
 */