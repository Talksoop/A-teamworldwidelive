import { prisma } from "../../../../lib/prisma";
import { getSessionHostId } from "../../../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "PATCH" && req.method !== "DELETE") {
    res.setHeader("Allow", ["PATCH", "DELETE"]);
    return res.status(405).end();
  }

  const hostId = getSessionHostId(req);
  if (!hostId) {
    return res.status(401).json({ error: "Not authorized." });
  }
  const me = await prisma.host.findUnique({ where: { id: hostId } });
  if (!me || !me.isFounder) {
    return res.status(403).json({ error: "Founder only." });
  }

  const { id } = req.query;
  const target = await prisma.host.findUnique({ where: { id } });
  if (!target) {
    return res.status(404).json({ error: "Not found." });
  }
  if (target.isFounder) {
    return res.status(400).json({ error: "Can't suspend or delete the primary admin account." });
  }

  if (req.method === "PATCH") {
    const { suspended } = req.body || {};
    if (typeof suspended !== "boolean") {
      return res.status(400).json({ error: "suspended must be true or false." });
    }
    await prisma.host.update({ where: { id }, data: { suspended } });
    return res.status(200).json({ ok: true, suspended });
  }

  // DELETE — permanently remove this host and everything scoped to their
  // channel. There are no DB-level foreign keys in this schema (see
  // schema.prisma), so we clean up related rows ourselves. Fan/AmaRequest
  // rows keep their own account; only the host-owned rows disappear.
  await prisma.$transaction([
    prisma.submission.deleteMany({ where: { hostId: id } }),
    prisma.offer.deleteMany({ where: { hostId: id } }),
    prisma.battle.deleteMany({ where: { hostId: id } }),
    prisma.settings.deleteMany({ where: { hostId: id } }),
    prisma.liveEvent.deleteMany({ where: { hostId: id } }),
    prisma.radioRecommendation.deleteMany({ where: { hostId: id } }),
    prisma.amaRequest.deleteMany({ where: { hostId: id } }),
    prisma.follow.deleteMany({ where: { hostId: id } }),
    prisma.host.delete({ where: { id } }),
  ]);
  return res.status(200).json({ ok: true, deleted: true });
}
