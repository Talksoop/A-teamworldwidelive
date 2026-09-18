import { prisma } from "../../../lib/prisma";
import { isAuthed } from "../../../lib/auth";

export default async function handler(req, res) {
  if (req.method === "GET") {
    // Public by default (submit page needs active offers). Admin can pass
    // ?all=1 to see inactive ones too.
    const { all } = req.query;
    if (all && !isAuthed(req)) {
      return res.status(401).json({ error: "Not authorized." });
    }
    const offers = await prisma.offer.findMany({
      where: all ? undefined : { active: true },
      orderBy: [{ type: "asc" }, { priority: "desc" }, { priceCents: "asc" }],
    });
    return res.status(200).json(offers);
  }

  if (req.method === "POST") {
    if (!isAuthed(req)) {
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
