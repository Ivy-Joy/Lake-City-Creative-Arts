// backend/src/utils/tokens.js
//For token creation/generation and verification
import jwt from "jsonwebtoken";
import config from "../config/config.js";
  export default function generateToken(userId, roles = ["user"]) {
    return jwt.sign({ userId, roles }, config.JWT_ACCESS_SECRET, {
      expiresIn: "7d"
    });
  }

 export function signAccessToken(payload) {
   return jwt.sign(payload, config.JWT_ACCESS_SECRET, { expiresIn: config.ACCESS_EXPIRES_IN });
 }

 export function signRefreshToken(payload) {
  //console.log("Refresh secret in sign:", config.JWT_REFRESH_SECRET);
   return jwt.sign(payload, config.JWT_REFRESH_SECRET, { expiresIn: config.REFRESH_EXPIRES_IN || "7d"});
 }

 export function verifyAccessToken(token) {
   return jwt.verify(token, config.JWT_ACCESS_SECRET);
 }

 export function verifyRefreshToken(token) {
  //console.log("Refresh secret in verify:", config.JWT_REFRESH_SECRET);
   return jwt.verify(token, config.JWT_REFRESH_SECRET);
 }
