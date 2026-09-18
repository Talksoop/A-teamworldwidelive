import { prisma } from "../../../lib/prisma";
import { isAuthed } from "../../../lib/auth";

export default async function handler(req, res) {
  if (!isAuthed(req)) {
    return res.status(401).json({ error: "Not authorized." });
  }

  const { id } = req.query;

  if (req.method === "PATCH") {
    const { name, description, priceCents, priority, active } = req.body || {};
    if (typeof priceCents !== "undefined" && (!Number.isInteger(priceCents) || priceCents <= 0)) {
      return res.status(400).json({ error: "priceCents must be a positive integer." });
    }
    const updated = await prisma.offer.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(typeof description !== "undefined" ? { description } : {}),
        ...(typeof priceCents !== "undefined" ? { priceCents } : {}),
        ...(typeof priority !== "undefined" ? { priority: Number(priority) || 0 } : {}),
        ...(typeof active !== "undefined" ? { active: Boolean(active) } : {}),
      },
    });
    return res.status(200).json(updated);
  }

  if (req.method === "DELETE") {
    await prisma.offer.delete({ where: { id } });
    return res.status(204).end();
  }

  res.setHeader("Allow", ["PATCH", "DELETE"]);
  return res.status(405).end();
}
