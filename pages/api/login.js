import { prisma } from "../../lib/prisma";
import { verifyPassword, sessionCookie } from "../../lib/auth";
import { rateLimited } from "../../lib/rateLimit";
import { ensureLinkedFanCookie } from "../../lib/accountLink";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end();
  }

  if (rateLimited(req, res, "login", { windowMs: 15 * 60 * 1000, max: 10 })) return;

  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const host = await prisma.host.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!host || !(await verifyPassword(password, host.passwordHash))) {
    return res.status(401).json({ error: "Wrong email or password." });
  }

  // Also log them into the fan side under the same email, so switching
  // between the creator and fan parts of the site doesn't ask for another
  // sign-in.
  const fanCookie = await ensureLinkedFanCookie(host);
  res.setHeader("Set-Cookie", [sessionCookie(host.id), fanCookie]);
  return res.status(200).json({ ok: true, slug: host.slug });
}
