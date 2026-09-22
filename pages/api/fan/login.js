import { prisma } from "../../../lib/prisma";
import { verifyPassword } from "../../../lib/auth";
import { fanSessionCookie } from "../../../lib/fanAuth";
import { rateLimited } from "../../../lib/rateLimit";
import { linkedHostCookieIfExists } from "../../../lib/accountLink";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end();
  }
  if (rateLimited(req, res, "fan-login", { windowMs: 15 * 60 * 1000, max: 10 })) return;

  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const fan = await prisma.fan.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!fan) {
    return res.status(401).json({ error: "Wrong email or password." });
  }
  if (!fan.passwordHash) {
    return res.status(401).json({ error: "This account signs in with Google — use \"Continue with Google\" below." });
  }
  if (!(await verifyPassword(password, fan.passwordHash))) {
    return res.status(401).json({ error: "Wrong email or password." });
  }

  // If this email also has a creator account, log them into that side too
  // — no separate password prompt, since they've already proven this
  // email+password pair. (We don't auto-create a creator account here; see
  // lib/accountLink.js for why.)
  const hostCookie = await linkedHostCookieIfExists(fan);
  res.setHeader("Set-Cookie", hostCookie ? [fanSessionCookie(fan.id), hostCookie] : fanSessionCookie(fan.id));
  return res.status(200).json({ ok: true, name: fan.name });
}
