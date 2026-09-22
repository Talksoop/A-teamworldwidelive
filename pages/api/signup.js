import { prisma } from "../../lib/prisma";
import { hashPassword, sessionCookie } from "../../lib/auth";
import { slugify } from "../../lib/host";
import { rateLimited } from "../../lib/rateLimit";
import { notifyFounderNewHost } from "../../lib/notifications";
import { ensureLinkedFanCookie } from "../../lib/accountLink";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end();
  }

  if (rateLimited(req, res, "signup", { windowMs: 60 * 60 * 1000, max: 5 })) return;

  const { email, password, name } = req.body || {};
  if (!email || !password || !name) {
    return res.status(400).json({ error: "Name, email, and password are required." });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters." });
  }

  const existing = await prisma.host.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (existing) {
    return res.status(400).json({ error: "An account with that email already exists." });
  }

  let baseSlug = slugify(name) || "host";
  let slug = baseSlug;
  let n = 1;
  while (await prisma.host.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${baseSlug}-${n}`;
  }

  const passwordHash = await hashPassword(password);
  const host = await prisma.host.create({
    data: {
      email: email.trim().toLowerCase(),
      passwordHash,
      name: name.trim(),
      slug,
    },
  });
  await prisma.settings.create({ data: { hostId: host.id } });
  notifyFounderNewHost(host);

  const fanCookie = await ensureLinkedFanCookie(host);
  res.setHeader("Set-Cookie", [sessionCookie(host.id), fanCookie]);
  return res.status(201).json({ ok: true, slug: host.slug });
}
