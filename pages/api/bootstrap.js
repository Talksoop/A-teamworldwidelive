import { prisma } from "../../lib/prisma";
import { hashPassword } from "../../lib/auth";

const PLACEHOLDER = "PENDING_HOST_ASSIGNMENT";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end();
  }

  if (req.headers["x-bootstrap-secret"] !== process.env.BOOTSTRAP_SECRET) {
    return res.status(401).json({ error: "Not authorized." });
  }

  const { email, password, name, slug } = req.body || {};
  if (!email || !password || !name || !slug) {
    return res.status(400).json({ error: "email, password, name, and slug are required." });
  }

  const existing = await prisma.host.findUnique({ where: { email } });
  if (existing) {
    return res.status(200).json({ ok: true, alreadyExists: true, hostId: existing.id, slug: existing.slug });
  }

  const passwordHash = await hashPassword(password);
  const host = await prisma.host.create({
    data: { email, passwordHash, name, slug, isFounder: true },
  });

  const [subs, offers, battles, amas] = await Promise.all([
    prisma.submission.updateMany({
      where: { hostId: PLACEHOLDER },
      data: { hostId: host.id },
    }),
    prisma.offer.updateMany({
      where: { hostId: PLACEHOLDER },
      data: { hostId: host.id },
    }),
    prisma.battle.updateMany({
      where: { hostId: PLACEHOLDER },
      data: { hostId: host.id },
    }),
    prisma.amaRequest.updateMany({
      where: { hostId: PLACEHOLDER },
      data: { hostId: host.id },
    }),
  ]);

  // Settings is a 1:1 row; there's at most one placeholder row to adopt.
  const settingsRow = await prisma.settings.findFirst({ where: { hostId: PLACEHOLDER } });
  if (settingsRow) {
    await prisma.settings.update({ where: { id: settingsRow.id }, data: { hostId: host.id } });
  } else {
    await prisma.settings.upsert({
      where: { hostId: host.id },
      update: {},
      create: { hostId: host.id },
    });
  }

  return res.status(201).json({
    ok: true,
    hostId: host.id,
    slug: host.slug,
    migrated: {
      submissions: subs.count,
      offers: offers.count,
      battles: battles.count,
      amaRequests: amas.count,
      settings: Boolean(settingsRow),
    },
  });
}
