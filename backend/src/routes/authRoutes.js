// backend/src/routes/authRoutes.js
//Routes for authentication: register, login, me, verifyEmail (email verification), 
// forgot-password/password reset, refresh token (JWT rotation), logout
import { Router } from "express";
import { body } from "express-validator";
import { protect } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import {
  register,
  login,
  me,
  verifyEmail,
  resetPassword,
  requestPasswordReset,
  refreshTokenHandler as refreshToken,
  resendVerification,
  logout,
} from "../controllers/authController.js";

const router = Router();

// @route   POST /api/auth/register
// @desc    Register user
router.post(
  "/register",
  [
    body("firstName").trim().notEmpty().withMessage("First name is required"),
    body("lastName").trim().notEmpty().withMessage("Last name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
  ],
  validate,
  register
);

// @route   POST /api/auth/login
// @desc    Login user
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validate,
  login
);

// @route   GET /api/auth/me
// @desc    Get logged in user profile
router.get("/me", protect, me);

// @route   GET /api/auth/verify/:token
// @desc    Verify email address
router.get("/verify/:token", verifyEmail);

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
router.post(
  "/forgot-password",
  [body("email").isEmail().withMessage("Valid email is required")],
  validate,
  requestPasswordReset
);

// @route   POST /api/auth/reset-password/:token
// @desc    Reset password
router.post(
  "/reset-password/:token",
  [
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
  ],
  validate,
  resetPassword
);

// @route   POST /api/auth/refresh
// @desc    Refresh access token
router.post("/refresh", refreshToken);

// @route   POST /api/auth/resend-verification
// @desc    Resend email verification link
router.post(
  "/resend-verification",
  [body("email").isEmail().withMessage("Valid email is required")],
  validate,
  resendVerification
);


// @route   POST /api/auth/logout
// @desc    Logout user (invalidate refresh token / clear cookie)
router.post("/logout", logout);

export default router;
