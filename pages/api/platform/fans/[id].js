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
  const target = await prisma.fan.findUnique({ where: { id } });
  if (!target) {
    return res.status(404).json({ error: "Not found." });
  }
  // A Host login auto-creates a Fan row under the same email (see
  // lib/accountLink.js) -- block acting on the founder's own linked fan
  // account so they can't lock themselves out from the fan side either.
  const linkedFounderHost = await prisma.host.findUnique({ where: { email: target.email } });
  if (linkedFounderHost?.isFounder) {
    return res.status(400).json({ error: "Can't suspend or delete the primary admin account." });
  }

  if (req.method === "PATCH") {
    const { suspended } = req.body || {};
    if (typeof suspended !== "boolean") {
      return res.status(400).json({ error: "suspended must be true or false." });
    }
    await prisma.fan.update({ where: { id }, data: { suspended } });
    return res.status(200).json({ ok: true, suspended });
  }

  // DELETE — permanently remove this fan account. Their follows are purely
  // fan-owned and disappear with them; submissions/AMA requests they made
  // belong to the host's channel history, so we keep those rows and just
  // detach the fanId rather than deleting a host's queue history.
  await prisma.$transaction([
    prisma.follow.deleteMany({ where: { fanId: id } }),
    prisma.submission.updateMany({ where: { fanId: id }, data: { fanId: null } }),
    prisma.amaRequest.updateMany({ where: { fanId: id }, data: { fanId: null } }),
    prisma.radioRecommendation.updateMany({ where: { fanId: id }, data: { fanId: null } }),
    prisma.fan.delete({ where: { id } }),
  ]);
  return res.status(200).json({ ok: true, deleted: true });
}
