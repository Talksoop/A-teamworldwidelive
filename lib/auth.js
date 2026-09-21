import crypto from "crypto";
import bcrypt from "bcryptjs";

const COOKIE_NAME = "atwl_session";

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s) {
    throw new Error("SESSION_SECRET is not set. Set it in your environment.");
  }
  return s;
}

function sign(value) {
  return crypto.createHmac("sha256", secret()).update(value).digest("hex");
}

export function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// Session cookie value is "<hostId>.<hmac(hostId)>" — a simple signed token
// so we don't need a full JWT library or server-side session store.
export function sessionCookie(hostId) {
  const token = `${hostId}.${sign(hostId)}`;
  return `${COOKIE_NAME}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`;
}

export function clearCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`;
}

// Returns the authenticated host's id, or null.
export function getSessionHostId(req) {
  const cookie = req.cookies?.[COOKIE_NAME];
  if (!cookie) return null;
  const dotIndex = cookie.lastIndexOf(".");
  if (dotIndex === -1) return null;
  const hostId = cookie.slice(0, dotIndex);
  const sig = cookie.slice(dotIndex + 1);
  try {
    if (sig === sign(hostId)) return hostId;
  } catch {
    // SESSION_SECRET missing — treat as unauthenticated rather than crash.
  }
  return null;
}
