import crypto from "crypto";

const STATE_COOKIE = "atwl_oauth_state";

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s) {
    throw new Error("SESSION_SECRET is not set. Set it in your environment.");
  }
  return s;
}

function sign(value) {
  return crypto.createHmac("sha256", secret()).update(`oauth:${value}`).digest("hex");
}

// The OAuth "state" param does two jobs: CSRF protection (its nonce must
// match a cookie we set right before redirecting to Google) and carrying
// which login flow started it (role: "host" | "fan") and where to send the
// person back to afterward. It's short-lived (10 min) and only ever read
// right after the Google redirect completes.
export function buildStateAndCookie(role, returnTo) {
  const nonce = crypto.randomBytes(16).toString("hex");
  const payload = `${nonce}.${role}.${Buffer.from(returnTo || "/").toString("base64url")}`;
  const sig = sign(payload);
  const state = `${payload}.${sig}`;
  const cookie = `${STATE_COOKIE}=${nonce}; HttpOnly; Path=/; SameSite=Lax; Max-Age=600`;
  return { state, cookie };
}

export function verifyState(state, cookieNonce) {
  if (!state || !cookieNonce) return null;
  const parts = state.split(".");
  if (parts.length !== 4) return null;
  const [nonce, role, returnToB64, sig] = parts;
  const payload = `${nonce}.${role}.${returnToB64}`;
  if (sig !== sign(payload)) return null;
  if (nonce !== cookieNonce) return null;
  if (role !== "host" && role !== "fan") return null;

  let returnTo = "/";
  try {
    returnTo = Buffer.from(returnToB64, "base64url").toString("utf8") || "/";
  } catch {
    returnTo = "/";
  }
  // Only ever redirect same-site — never let the state param send someone
  // off to an external URL.
  if (!returnTo.startsWith("/") || returnTo.startsWith("//")) returnTo = "/";

  return { role, returnTo };
}

export function clearStateCookie() {
  return `${STATE_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`;
}

function redirectUri() {
  const base = process.env.APP_BASE_URL;
  if (!base) {
    throw new Error("APP_BASE_URL is not set — needed to build the Google OAuth redirect URI.");
  }
  return `${base.replace(/\/$/, "")}/api/auth/google/callback`;
}

export function googleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.APP_BASE_URL);
}

export function googleAuthorizeUrl(state) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "select_account",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// Exchanges the authorization code for tokens, then fetches the person's
// Google profile (id/sub, email, name). No extra OAuth library — Google's
// endpoints are plain REST, and the app's existing auth is hand-rolled too.
export async function exchangeCodeForProfile(code) {
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri(),
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) {
    throw new Error(`Google token exchange failed: ${await tokenRes.text()}`);
  }
  const tokens = await tokenRes.json();

  const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!profileRes.ok) {
    throw new Error(`Google profile fetch failed: ${await profileRes.text()}`);
  }
  // { sub, email, email_verified, name, picture, ... }
  return profileRes.json();
}
