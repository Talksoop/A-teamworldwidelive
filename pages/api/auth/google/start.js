import { buildStateAndCookie, googleAuthorizeUrl, googleConfigured } from "../../../../lib/googleAuth";

// Kicks off "Continue with Google" for either login flow.
// ?role=host|fan (default fan) and ?returnTo=/some/path (where to land after).
export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end();
  }

  if (!googleConfigured()) {
    return res
      .status(500)
      .send("Google sign-in isn't set up yet on this server (missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / APP_BASE_URL).");
  }

  const role = req.query.role === "host" ? "host" : "fan";
  const returnTo = typeof req.query.returnTo === "string" ? req.query.returnTo : "/";

  const { state, cookie } = buildStateAndCookie(role, returnTo);
  res.setHeader("Set-Cookie", cookie);
  res.writeHead(302, { Location: googleAuthorizeUrl(state) });
  res.end();
}
