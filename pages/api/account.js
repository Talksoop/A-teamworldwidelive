import { prisma } from "../../lib/prisma";
import { getSessionHostId, clearCookie } from "../../lib/auth";

export default async function handler(req, res) {
  const hostId = getSessionHostId(req);
  if (!hostId) {
    return res.status(401).json({ error: "Not authorized." });
  }
  if (req.method !== "DELETE") {
    res.setHeader("Allow", ["DELETE"]);
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
    prisma.host.delete({ where: { id: hostId } }),
  ]);

  res.setHeader("Set-Cookie", clearCookie());
  return res.status(200).json({ ok: true });
}
