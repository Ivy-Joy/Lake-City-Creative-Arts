// middlewares/auth.js
// Middleware for protecting routes and role-based access control
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import config from "../config/config.js";

//Protect routes requires valid JWT)
export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET);
    req.user = { 
      id: decoded.userId, 
      roles: decoded.roles
    };// attach minimal payload
    return next();
  } catch (err) {
    console.error("JWT verify error:", err.message);
    return res.status(401).json({ message: "Token invalid or expired" });
  }
};

// optional middleware if a route really needs full user object, it loads it.
export const loadUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    req.user = user;
    next();
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

//Restrict to admins
// export const adminOnly = (req, res, next) => {
//   if (req.user.roles !== "admin") {
//     return res.status(403).json({ message: "Admin access required" });
//   }
//   next();
// };
export const adminOnly = (req, res, next) => {
  if (!req.user || !req.user.roles || !req.user.roles.includes("admin")) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

