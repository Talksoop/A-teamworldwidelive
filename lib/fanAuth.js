import crypto from "crypto";

const COOKIE_NAME = "atwl_fan_session";

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s) {
    throw new Error("SESSION_SECRET is not set. Set it in your environment.");
  }
  return s;
}

function sign(value) {
  // Prefix so a fan token can never be replayed as a host token or vice
  // versa, even though they currently share SESSION_SECRET.
  return crypto.createHmac("sha256", secret()).update(`fan:${value}`).digest("hex");
}

export function fanSessionCookie(fanId) {
  const token = `${fanId}.${sign(fanId)}`;
  return `${COOKIE_NAME}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`;
}

export function clearFanCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`;
}

// Returns the authenticated fan's id, or null.
export function getSessionFanId(req) {
  const cookie = req.cookies?.[COOKIE_NAME];
  if (!cookie) return null;
  const dotIndex = cookie.lastIndexOf(".");
  if (dotIndex === -1) return null;
  const fanId = cookie.slice(0, dotIndex);
  const sig = cookie.slice(dotIndex + 1);
  try {
    if (sig === sign(fanId)) return fanId;
  } catch {
    // SESSION_SECRET missing — treat as unauthenticated rather than crash.
  }
  return null;
}
