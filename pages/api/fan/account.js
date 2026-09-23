import { prisma } from "../../../lib/prisma";
import { getSessionFanId, clearFanCookie } from "../../../lib/fanAuth";

export default async function handler(req, res) {
  const fanId = getSessionFanId(req);
  if (!fanId) {
    return res.status(401).json({ error: "Not authorized." });
  }
  if (req.method !== "DELETE") {
    res.setHeader("Allow", ["DELETE"]);
    return res.status(405).end();
  }

  const fan = await prisma.fan.findUnique({ where: { id: fanId } });
  if (!fan) {
    return res.status(404).json({ error: "Not found." });
  }

  // A fan's submissions/AMA requests/radio recommendations live on a
  // creator's channel and stay there (that's the creator's record of their
  // queue/history) — we just detach this fan's identity from them rather
  // than deleting someone else's data. Follows are the fan's own data, so
  // those get removed outright.
  await prisma.$transaction([
    prisma.follow.deleteMany({ where: { fanId } }),
    prisma.submission.updateMany({ where: { fanId }, data: { fanId: null } }),
    prisma.amaRequest.updateMany({ where: { fanId }, data: { fanId: null } }),
    prisma.radioRecommendation.updateMany({ where: { fanId }, data: { fanId: null } }),
    prisma.fan.delete({ where: { id: fanId } }),
  ]);

  res.setHeader("Set-Cookie", clearFanCookie());
  return res.status(200).json({ ok: true });
}
