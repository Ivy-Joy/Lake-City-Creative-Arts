// src/routes/cartRoutes.js
import express from "express";
import { protect } from "../middleware/auth.js";
import * as ctrl from "../controllers/cartController.js";

const router = express.Router();

// For guest: pass sessionId query param or in body
router.get("/", ctrl.getCart); // ?sessionId=...
router.post("/", ctrl.addOrUpdateItem); // body: { sessionId?, productId, quantity } 
router.put("/", ctrl.addOrUpdateItem); // update item e.g replace quantity
router.delete("/item/:productId", ctrl.removeItem);
router.delete("/", ctrl.clearCart); //clear cart
router.post("/merge", protect, ctrl.mergeCart); // logged-in user merges guest cart (merge guest cart into user cart)

export default router;
