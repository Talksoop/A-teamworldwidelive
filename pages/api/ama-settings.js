import { prisma } from "../../lib/prisma";
import { isAuthed } from "../../lib/auth";

async function getSettings() {
  return prisma.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    const s = await getSettings();
    return res.status(200).json({ amaEnabled: s.amaEnabled, amaPriceCents: s.amaPriceCents });
  }

  if (req.method === "PATCH") {
    if (!isAuthed(req)) {
      return res.status(401).json({ error: "Not authorized." });
    }
    const { amaEnabled, amaPriceCents } = req.body || {};
    if (typeof amaPriceCents !== "undefined" && (!Number.isInteger(amaPriceCents) || amaPriceCents < 0)) {
      return res.status(400).json({ error: "amaPriceCents must be a non-negative integer." });
    }
    await getSettings();
    const updated = await prisma.settings.update({
      where: { id: "singleton" },
      data: {
        ...(typeof amaEnabled !== "undefined" ? { amaEnabled: Boolean(amaEnabled) } : {}),
        ...(typeof amaPriceCents !== "undefined" ? { amaPriceCents } : {}),
      },
    });
    return res.status(200).json({ amaEnabled: updated.amaEnabled, amaPriceCents: updated.amaPriceCents });
  }

  res.setHeader("Allow", ["GET", "PATCH"]);
  return res.status(405).end();
}
