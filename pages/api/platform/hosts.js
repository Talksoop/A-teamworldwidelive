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

  const hosts = await prisma.host.findMany({ orderBy: { createdAt: "asc" } });
  const hostIds = hosts.map((h) => h.id);

  const [paidSubmissions, paidAma, submissionCounts, amaCounts] = await Promise.all([
    prisma.submission.findMany({
      where: { hostId: { in: hostIds }, paid: true },
      select: { hostId: true, amountCents: true },
    }),
    prisma.amaRequest.findMany({
      where: { hostId: { in: hostIds }, paid: true },
      select: { hostId: true, amountCents: true },
    }),
    prisma.submission.groupBy({ by: ["hostId"], where: { hostId: { in: hostIds } }, _count: true }),
    prisma.amaRequest.groupBy({ by: ["hostId"], where: { hostId: { in: hostIds } }, _count: true }),
  ]);

  const revenueByHost = {};
  const paidCountByHost = {};
  for (const row of [...paidSubmissions, ...paidAma]) {
    revenueByHost[row.hostId] = (revenueByHost[row.hostId] || 0) + row.amountCents;
    paidCountByHost[row.hostId] = (paidCountByHost[row.hostId] || 0) + 1;
  }
  const submissionCountByHost = Object.fromEntries(
    submissionCounts.map((r) => [r.hostId, r._count])
  );
  const amaCountByHost = Object.fromEntries(amaCounts.map((r) => [r.hostId, r._count]));

  const rows = hosts.map((h) => {
    const grossCents = revenueByHost[h.id] || 0;
    const platformFeeCents = h.isFounder ? 0 : Math.round((grossCents * h.platformFeeBps) / 10000);
    return {
      id: h.id,
      name: h.name,
      slug: h.slug,
      email: h.email,
      isFounder: h.isFounder,
      stripeOnboarded: h.stripeOnboarded,
      platformFeeBps: h.platformFeeBps,
      createdAt: h.createdAt,
      submissionCount: submissionCountByHost[h.id] || 0,
      amaCount: amaCountByHost[h.id] || 0,
      paidTransactionCount: paidCountByHost[h.id] || 0,
      grossRevenueCents: grossCents,
      platformFeeCents,
    };
  });

  const totals = rows.reduce(
    (acc, r) => ({
      grossRevenueCents: acc.grossRevenueCents + r.grossRevenueCents,
      platformFeeCents: acc.platformFeeCents + r.platformFeeCents,
      hostCount: acc.hostCount + 1,
    }),
    { grossRevenueCents: 0, platformFeeCents: 0, hostCount: 0 }
  );

  return res.status(200).json({ hosts: rows, totals });
}
