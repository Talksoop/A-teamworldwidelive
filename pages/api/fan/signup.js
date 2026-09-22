import { prisma } from "../../../lib/prisma";
import { hashPassword } from "../../../lib/auth";
import { fanSessionCookie } from "../../../lib/fanAuth";
import { rateLimited } from "../../../lib/rateLimit";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end();
  }
  if (rateLimited(req, res, "fan-signup", { windowMs: 60 * 60 * 1000, max: 8 })) return;

  const { email, password, name } = req.body || {};
  if (!email || !password || !name) {
    return res.status(400).json({ error: "Name, email, and password are required." });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters." });
  }
  if (name.length > 60 || email.length > 200) {
    return res.status(400).json({ error: "One of the fields is too long." });
  }

  const existing = await prisma.fan.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (existing) {
    return res.status(409).json({ error: "An account with that email already exists." });
  }

  const passwordHash = await hashPassword(password);
  const fan = await prisma.fan.create({
    data: {
      email: email.trim().toLowerCase(),
      passwordHash,
      name: name.trim(),
    },
  });

  res.setHeader("Set-Cookie", fanSessionCookie(fan.id));
  return res.status(201).json({ ok: true, name: fan.name });
}
