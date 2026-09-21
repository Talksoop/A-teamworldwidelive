import { prisma } from "../../../lib/prisma";
import { getSessionHostId } from "../../../lib/auth";
import { getHostBySlug } from "../../../lib/host";

export default async function handler(req, res) {
  if (req.method === "GET") {
    // Admin (?all=1, needs the session) sees every offer for their own
    // channel. Public (submit page) passes ?slug=... and sees only active ones.
    const { all, slug } = req.query;

    let hostId;
    if (all) {
      hostId = getSessionHostId(req);
      if (!hostId) {
        return res.status(401).json({ error: "Not authorized." });
      }
    } else {
      const host = await getHostBySlug(slug);
      if (!host) {
        return res.status(404).json({ error: "Channel not found." });
      }
      hostId = host.id;
    }

    const offers = await prisma.offer.findMany({
      where: all ? { hostId } : { hostId, active: true },
      orderBy: [{ type: "asc" }, { priority: "desc" }, { priceCents: "asc" }],
    });
    return res.status(200).json(offers);
  }

  if (req.method === "POST") {
    const hostId = getSessionHostId(req);
    if (!hostId) {
      return res.status(401).json({ error: "Not authorized." });
    }
    const { type, name, description, priceCents, priority } = req.body || {};
    if (!["SKIP", "REACT"].includes(type)) {
      return res.status(400).json({ error: "type must be SKIP or REACT." });
    }
    if (!name || typeof name !== "string" || name.length > 80) {
      return res.status(400).json({ error: "Name is required (max 80 chars)." });
    }
    if (!Number.isInteger(priceCents) || priceCents <= 0) {
      return res.status(400).json({ error: "priceCents must be a positive integer." });
    }
    const offer = await prisma.offer.create({
      data: {
        hostId,
        type,
        name: name.trim(),
        description: description ? description.trim() : null,
        priceCents,
        priority: type === "SKIP" ? Number(priority) || 0 : 0,
        bonusSubmissions: type === "SKIP" ? Number(req.body.bonusSubmissions) || 0 : 0,
      },
    });
    return res.status(201).json(offer);
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end();
}
