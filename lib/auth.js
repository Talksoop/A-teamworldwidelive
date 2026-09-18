import crypto from "crypto";

const COOKIE_NAME = "auxcord_admin";

function expectedToken() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error(
      "ADMIN_PASSWORD is not set. Set it in your environment before deploying the admin dashboard."
    );
  }
  return crypto.createHash("sha256").update(password).digest("hex");
}

export function checkPassword(password) {
  return password === process.env.ADMIN_PASSWORD;
}

export function authCookie() {
  return `${COOKIE_NAME}=${expectedToken()}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`;
}

export function clearCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`;
}

export function isAuthed(req) {
  const cookie = req.cookies?.[COOKIE_NAME];
  if (!cookie) return false;
  try {
    return cookie === expectedToken();
  } catch {
    return false;
  }
}
