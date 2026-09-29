import { prisma } from "../../lib/prisma";
import { getSessionHostId, clearCookie } from "../../lib/auth";

export default async function handler(req, res) {
  const hostId = getSessionHostId(req);
  if (!hostId) {
    return res.status(401).json({ error: "Not authorized." });
  }

  if (req.method === "PATCH") {
    const { name } = req.body || {};
    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Display name can't be empty." });
    }
    const trimmed = name.trim();
    if (trimmed.length > 60) {
      return res.status(400).json({ error: "Display name must be 60 characters or fewer." });
    }
    const updated = await prisma.host.update({ where: { id: hostId }, data: { name: trimmed } });
    return res.status(200).json({ id: updated.id, name: updated.name });
  }

  if (req.method !== "DELETE") {
    res.setHeader("Allow", ["PATCH", "DELETE"]);
    return res.status(405).end();
  }

  const host = await prisma.host.findUnique({ where: { id: hostId } });
  if (!host) {
    return res.status(404).json({ error: "Not found." });
  }
  if (host.isFounder) {
    return res.status(400).json({ error: "The founder account can't be deleted." });
  }

  await prisma.$transaction([
    prisma.submission.deleteMany({ where: { hostId } }),
    prisma.offer.deleteMany({ where: { hostId } }),
    prisma.battle.deleteMany({ where: { hostId } }),
    prisma.amaRequest.deleteMany({ where: { hostId } }),
    prisma.settings.deleteMany({ where: { hostId } }),
    prisma.liveEvent.deleteMany({ where: { hostId } }),
    prisma.radioRecommendation.deleteMany({ where: { hostId } }),
    prisma.follow.deleteMany({ where: { hostId } }),
    prisma.host.delete({ where: { id: hostId } }),
  ]);

  res.setHeader("Set-Cookie", clearCookie());
  return res.status(200).json({ ok: true });
}
