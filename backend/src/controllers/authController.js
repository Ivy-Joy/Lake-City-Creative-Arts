// backend/src/controllers/authController.js
//The refresh token is rotated on every refresh to reduce risk of reuse.
//Refresh tokens are stored hashed in DB (sha256) so DB breaches won't expose usable tokens.
//You can tighten logout by deleting all refreshTokens on suspicious reuse.

import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/generateToken.js";
import { sendVerificationEmail } from "../utils/verifyEmailHelper.js";
import config from "../config/config.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const COOKIE_NAME = "lcc_rt"; // refresh token cookie name where it is being stored

// helper: set secure cookie
function setRefreshCookie(res, token) {
  console.log(
    "Setting cookie:",
    COOKIE_NAME,
    token ? token.substring(0, 20) + "..." : "NO TOKEN"
  );
  const cookieOptions = {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: "lax",
    path:"/",
    maxAge: 1000 * 60 * 60 * 24 * 7, // match REFRESH_EXPIRES_IN (7d)
  };
  //if (config.COOKIE_DOMAIN) cookieOptions.domain = config.COOKIE_DOMAIN;
  res.cookie(COOKIE_NAME, token, cookieOptions);
}

// register
export async function register(req, res) {
  const { firstName, lastName, email, password, acceptedTerms } = req.body;

  // 1. Basic validation here 
  if (!firstName || !lastName || !email || !password || acceptedTerms !==true) {
    return res.status(400).json({ message: "Missing required fields or terms not accepted" });
  }

  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ message: "Email already registered" });

  // 2. Hash password manually Or rely on pre-save hook
  //Here we rely on pre-save hook (cleaner)
  // Generate raw token (sent to user) and hashed token (stored)
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashed = User.hashToken(rawToken);
  const expires = new Date(Date.now() + (Number(config.VERIFICATION_EXPIRES_MIN || 60) * 60 * 1000));

  //enforce acceptedTerms
  if (!acceptedTerms) {
    return res.status(400).json({ message: "You must accept terms & conditions" });
  }

  //const salt = await bcrypt.genSalt(12);
  //const passwordHash = await bcrypt.hash(password, salt);

  // 3. Create user 
  const user = new User({ 
    firstName, 
    lastName, 
    email, 
    passwordHash: password, //correct field, bcrypt will hash via pre-save (plain password, will be hashed in pre-save)
    acceptedTerms: true, //enforce terms acceptance
    isVerified: true,
    emailVerificationToken: hashed,
    emailVerificationExpires: expires,
  });

  await user.save();

  // 4. Send verification email (async)
  try {
    await sendVerificationEmail(user, rawToken);
  } catch (err) {
    // In dev it's fine — log it. In prod you may want to retry or queue the send.
    console.error("Verification email send error:", err);
  }

  // Optionally create a session immediately or require email verification
  res.status(201).json({ message: "Registered. Check your email for verification." });
}

//RESEND VERIFICATION TOKEN WHEN IT HAS EXPIRED
export async function resendVerification(req, res) {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });
  if (user.isVerified) {
    return res.status(400).json({ message: "Email is already verified" });
  }

  // Generate a new token
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashed = User.hashToken(rawToken);
  const expires = new Date(Date.now() + (Number(config.VERIFICATION_EXPIRES_MIN || 60) * 60 * 1000));

  user.emailVerificationToken = hashed;
  user.emailVerificationExpires = expires;
  await user.save();

  try {
    await sendVerificationEmail(user, rawToken);
  } catch (err) {
    console.error("Resend verification error:", err);
    return res.status(500).json({ message: "Could not send email. Try again later." });
  }

  res.json({ message: "Verification email resent. Please check your inbox." });
}


// login
export async function login(req, res) {
  const { email, password } = req.body;

  // 1. Find user by email
  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  // 2. Ensure email is verified 
  if (!user.isVerified) {
    return res.status(403).json({message: "Please verify your email before logging in."});
  }

  // 3. Compare password
  //const ok = await bcrypt.compare(password, user.passwordHash); //commented out because I already defined a helper userSchema.methods.matchPassword
  const ok = await user.matchPassword(password);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  // 4. Generate tokens
  // Create access token (short lived)
  const accessToken = signAccessToken({ userId: user._id, roles: user.roles });
  // Create refresh token (long lived), store hashed in DB
  const refreshToken = signRefreshToken({ userId: user._id });

  //5. Hash refresh token & store
  const refreshHash = User.hashToken(refreshToken);
  const expiry = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // match REFRESH_EXPIRES_IN

  user.refreshTokens.push({ 
    tokenHash: refreshHash, 
    createdAt: new Date(), 
    expiresAt: expiry, 
    userAgent: req.get("User-Agent"), 
    ip: req.ip 
  });

  // Optional: keep only recent N tokens
  await user.save();

  // 6. Set httpOnly cookie
  setRefreshCookie(res, refreshToken);

  // 7. Return response
  // return access token and user profile (do not include sensitive fields)
  res.json({
    accessToken,
    user: { id: user._id, 
      email: user.email, 
      firstName: user.firstName, 
      roles: user.roles },
  });
}

// refresh
/*export async function refreshTokenHandler(req, res) {
  const token = req.cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ message: "No refresh token" });

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch (err) {
    return res.status(401).json({ message: "Invalid refresh token" });
  }

  const user = await User.findById(payload.userId);
  if (!user) return res.status(401).json({ message: "Invalid refresh token" });

  const tokenHash = User.hashToken(token);
  // Find matching hashed token
  const stored = user.refreshTokens.find(rt => rt.tokenHash === tokenHash);
  if (!stored) {
    // possible reuse/attack — you may want to clear all tokens on suspicious activity
    user.refreshTokens = []; await user.save();
    return res.status(401).json({ message: "Refresh token not recognized" });
  }

  // Optional: check expiry in DB (stored.expiresAt)
  if (stored.expiresAt && stored.expiresAt < new Date()) {
    // remove expired
    user.refreshTokens = user.refreshTokens.filter(rt => rt.tokenHash !== tokenHash);
    await user.save();
    return res.status(401).json({ message: "Refresh token expired" });
  }

  // rotate: delete old stored token and create new one
  user.refreshTokens = user.refreshTokens.filter(rt => rt.tokenHash !== tokenHash);
  const newRefreshToken = signRefreshToken({ userId: user._id });
  const newHash = User.hashToken(newRefreshToken);
  const newExpiry = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
  user.refreshTokens.push({ tokenHash: newHash, createdAt: new Date(), expiresAt: newExpiry, userAgent: req.get("User-Agent"), ip: req.ip });
  await user.save();

  // issue new access token
  const accessToken = signAccessToken({ userId: user._id, roles: user.roles });
  setRefreshCookie(res, newRefreshToken);

  res.json({
    accessToken,
    user: { id: user._id, email: user.email, firstName: user.firstName, roles: user.roles },
  });
} */
export async function refreshTokenHandler(req, res) {
  const token = req.cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ message: "No refresh token" });

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch (err) {
    return res.status(401).json({ message: "Invalid refresh token" });
  }

  const tokenHash = User.hashToken(token);

  // 1. ATOMIC FIND & REMOVE: Find the user and remove the old token in one step
  // This prevents the "double save" conflict
  const user = await User.findOneAndUpdate(
    { _id: payload.userId, "refreshTokens.tokenHash": tokenHash },
    { $pull: { refreshTokens: { tokenHash: tokenHash } } },
    { new: true }
  );

  // If no user was found, the token didn't exist in their array (reuse or invalid)
  if (!user) {
    return res.status(401).json({ message: "Refresh token not recognized" });
  }

  // 2. Prepare new token
  const newRefreshToken = signRefreshToken({ userId: user._id });
  const newHash = User.hashToken(newRefreshToken);
  const newExpiry = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

  const newTokenObj = {
    tokenHash: newHash,
    createdAt: new Date(),
    expiresAt: newExpiry,
    userAgent: req.get("User-Agent"),
    ip: req.ip
  };

  // 3. ATOMIC PUSH: Add the new token
  await User.findByIdAndUpdate(user._id, {
    $push: { refreshTokens: newTokenObj }
  });

  // 4. Issue tokens
  const accessToken = signAccessToken({ userId: user._id, roles: user.roles });
  setRefreshCookie(res, newRefreshToken);

  res.json({
    accessToken,
    user: { 
      id: user._id, 
      email: user.email, 
      firstName: user.firstName, 
      roles: user.roles 
    },
  });
}

// logout
export async function logout(req, res) {
  const token = req.cookies[COOKIE_NAME];
  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      const user = await User.findById(payload.userId);
      if (user) {
        const tokenHash = User.hashToken(token);
        user.refreshTokens = user.refreshTokens.filter(rt => rt.tokenHash !== tokenHash);
        await user.save();
      }
    } catch (err) {
      // ignore
    }
  }
  // Clear cookie
  res.clearCookie(COOKIE_NAME, { httpOnly: true, secure: config.NODE_ENV === "production", sameSite: "lax", domain: config.COOKIE_DOMAIN });
  res.json({ message: "Logged out" });
}

// get current user
export async function me(req, res) {
  // expects access token in Authorization header
  const auth = req.headers.authorization;
  //console.log(">>> /me auth header:", auth);        // debug
  if (!auth || !auth.startsWith("Bearer ")) return res.status(401).json({ message: "Unauthorized" });
  try {
    const jwtStr = auth.split(" ")[1];
    //console.log(">>> raw access token (first80):", jwtStr ? jwtStr.substring(0,80) + "..." : "NO TOKEN");
    //decode without verifying so we can inspect payload
    //const decodedUnsafe = jwt.decode(jwtStr, { complete: true });
    //console.log(">>> decoded (unsafe):", decodedUnsafe && decodedUnsafe.payload ? decodedUnsafe.payload : decodedUnsafe);

    // now verify with the access secret
    const payload = jwt.verify(jwtStr, config.JWT_ACCESS_SECRET);
    //console.log(">>> verified payload:", payload);

    const user = await User.findById(payload.userId).select("-passwordHash -refreshTokens");
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    res.json({ user });
  } catch (err) {
    console.error("me() token error:", err && err.name, err && err.message);
    return res.status(401).json({ message: "Invalid token" });
  }
}
// Note: Email verification, password reset functions would go here as well
// Additional functions like verifyEmail, requestPasswordReset, resetPassword would be implemented similarly,
// focusing on security best practices and proper error handling.
export async function verifyEmail(req, res) {
  const { token } = req.params;
  //if (!token) return res.status(400).json({ message: "No token provided" });

  //Handling the error case of missing token so that it redirects to a frontend error page instead of JSON
  if (!token) {
    return res.redirect(`${config.FRONTEND_URL}/verify-email?status=missing`);
  }

  const tokenHash = User.hashToken(token);
  const user = await User.findOne({ 
    emailVerificationToken: tokenHash, 
    emailVerificationExpires: { $gt: new Date() } 
  });

  //if (!user) return res.status(400).json({ message: "Invalid or expired token" });
  if (!user) {
    //incase a token is expired or invalid, we redirect both the success and failure to the user's frontend, and show a nice message.
    return res.redirect(`${config.FRONTEND_URL}/verify-email?status=invalid`);
  }

  // Mark user as verified and clear token/verification fields
  user.isVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;

  // Optionally: create session (rotate refresh tokens) and return access token so user is logged in
  //const accessToken = signAccessToken({ userId: user._id, roles: user.roles });
  const refreshToken = signRefreshToken({ userId: user._id });

  // store hashed refresh token in DB (rotate pattern)
  const refreshHash = User.hashToken(refreshToken);
  const expiry = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)); // 7 days
  user.refreshTokens = user.refreshTokens || [];
  user.refreshTokens.push({ tokenHash: refreshHash, createdAt: new Date(), expiresAt: expiry, userAgent: req.get("User-Agent"), ip: req.ip });

  await user.save();

  // Set (httponly) secure cookie
  /*res.cookie("lcc_rt", refreshToken, { 
    httpOnly: true, ////httpOnly: true → Makes the cookie invisible to JavaScript in the browser. This is for security, so attackers can’t steal it with document.cookie.
    secure: config.NODE_ENV === "production", //secure: true means the cookie is only sent over HTTPS (not HTTP).
    sameSite: "lax", //Protects against cross-site request forgery (CSRF). "lax" means the cookie is usually sent only when navigating within the same site (not from random external links).
    maxAge: 7*24*60*60*1000 //This tells how long the cookie should last in the browser:7*24*60*60*1000 = 7 days (7 days × 24 hours × 60 minutes × 60 seconds × 1000 milliseconds).
  }); *///refreshToken → This is the actual value you’re saving in the cookie.

  setRefreshCookie(res, refreshToken);

  // Return access token and user profile
  //res.json({ message: "Email verified successfully"});

  //Redirect user to login page on frontend with success status
  return res.redirect(`${config.FRONTEND_URL}/login?verified=true`);

}
export async function requestPasswordReset(req, res) {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(200).json({ message: "If that email is registered, a reset link has been sent." });

  const token = crypto.randomBytes(32).toString("hex");
  user.passwordResetToken = token;
  user.passwordResetExpires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
  await user.save();
  // Send email with reset link (e.g. `${config.FRONTEND_URL}/reset-password/${token}`)
  res.json({ message: "If that email is registered, a reset link has been sent." });
}
export async function resetPassword(req, res) {
  const { token } = req.params;
  const { password } = req.body;
  if (!token) return res.status(400).json({ message: "No token provided" });
  const user = await User.findOne({ passwordResetToken: token, passwordResetExpires: { $gt: new Date() } });
  if (!user) return res.status(400).json({ message: "Invalid or expired token" });
  const salt = await bcrypt.genSalt(12);
  user.passwordHash = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  res.json({ message: "Password has been reset" });
}

