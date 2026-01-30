import config from "../config/config.js";
import { sendEmail } from "./mailer.js";

export function buildVerifyUrl(token) {
  return `${config.FRONTEND_URL}/verify-email/${token}`;
}

export async function sendVerificationEmail(user, rawToken) {
  const verifyUrl = buildVerifyUrl(rawToken);
  const html = `
    <p>Hi ${user.firstName},</p>
    <p>Thanks for registering at Lake City Creatives. Please verify your email by clicking the link below:</p>
    <p><a href="${verifyUrl}">${verifyUrl}</a></p>
    <p>This link will expire in ${process.env.VERIFICATION_EXPIRES_MIN || 60} minutes.</p>
  `;
  await sendEmail({ to: user.email, subject: "Verify your email", html });
}
