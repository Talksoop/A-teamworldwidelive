import { prisma } from "../../../lib/prisma";
import { getSessionHostId } from "../../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
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

  const [fans, founderHosts] = await Promise.all([
    prisma.fan.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.host.findMany({ where: { isFounder: true }, select: { email: true } }),
  ]);
  const fanIds = fans.map((f) => f.id);
  const founderEmails = new Set(founderHosts.map((h) => h.email));

  const [followCounts, submissionCounts] = await Promise.all([
    prisma.follow.groupBy({ by: ["fanId"], where: { fanId: { in: fanIds } }, _count: true }),
    prisma.submission.groupBy({ by: ["fanId"], where: { fanId: { in: fanIds } }, _count: true }),
  ]);
  const followCountByFan = Object.fromEntries(followCounts.map((r) => [r.fanId, r._count]));
  const submissionCountByFan = Object.fromEntries(submissionCounts.map((r) => [r.fanId, r._count]));

  const rows = fans.map((f) => ({
    id: f.id,
    name: f.name,
    email: f.email,
    suspended: f.suspended,
    createdAt: f.createdAt,
    followCount: followCountByFan[f.id] || 0,
    submissionCount: submissionCountByFan[f.id] || 0,
    // This fan row is the auto-linked twin of a founder's own Host account
    // (see lib/accountLink.js) — Admin hides delete/suspend for it so the
    // founder can't lock themselves out via the fan side.
    isFounderLinked: founderEmails.has(f.email),
  }));

  return res.status(200).json({ fans: rows });
}
