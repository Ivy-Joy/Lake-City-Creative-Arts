// src/routes/shippingRoutes.js
import express from "express";
import * as ctrl from "../controllers/shippingController.js";
import { protect, adminOnly } from "../middleware/auth.js"; // adminOnly should be implemented

const router = express.Router();

router.get("/", ctrl.listRates);
router.post("/", protect, adminOnly, ctrl.createRate); // admin creates rate
router.post("/calculate", ctrl.calculateShipping); // body: { address }
router.put("/:id", protect, adminOnly, ctrl.updateRate);
router.delete("/:id", protect, adminOnly, ctrl.deleteRate);

export default router;
