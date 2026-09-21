import { prisma } from "../../lib/prisma";
import { verifyPassword, sessionCookie } from "../../lib/auth";
import { rateLimited } from "../../lib/rateLimit";

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

  res.setHeader("Set-Cookie", sessionCookie(host.id));
  return res.status(200).json({ ok: true, slug: host.slug });
}
