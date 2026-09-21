import { prisma } from "../../lib/prisma";
import { getSessionHostId } from "../../lib/auth";
import { getHostBySlug } from "../../lib/host";

async function getOrCreateSettings(hostId) {
  return prisma.settings.upsert({
    where: { hostId },
    update: {},
    create: { hostId },
  });
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { slug } = req.query;
    let hostId;
    if (slug) {
      const host = await getHostBySlug(slug);
      if (!host) {
        return res.status(404).json({ error: "Channel not found." });
      }
      hostId = host.id;
    } else {
      hostId = getSessionHostId(req);
      if (!hostId) {
        return res.status(401).json({ error: "Not authorized." });
      }
    }
    const s = await getOrCreateSettings(hostId);
    return res.status(200).json({ amaEnabled: s.amaEnabled, amaPriceCents: s.amaPriceCents });
  }

  if (req.method === "PATCH") {
    const hostId = getSessionHostId(req);
    if (!hostId) {
      return res.status(401).json({ error: "Not authorized." });
    }
    const { amaEnabled, amaPriceCents } = req.body || {};
    if (typeof amaPriceCents !== "undefined" && (!Number.isInteger(amaPriceCents) || amaPriceCents < 0)) {
      return res.status(400).json({ error: "amaPriceCents must be a non-negative integer." });
    }
    await getOrCreateSettings(hostId);
    const updated = await prisma.settings.update({
      where: { hostId },
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
