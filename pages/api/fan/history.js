import { prisma } from "../../../lib/prisma";
import { getSessionFanId } from "../../../lib/fanAuth";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end();
  }
  const fanId = getSessionFanId(req);
  if (!fanId) {
    return res.status(401).json({ error: "Not logged in." });
  }

  const [submissions, amaRequests] = await Promise.all([
    prisma.submission.findMany({ where: { fanId }, orderBy: { createdAt: "desc" } }),
    prisma.amaRequest.findMany({ where: { fanId }, orderBy: { createdAt: "desc" } }),
  ]);

  const hostIds = [...new Set([...submissions.map((s) => s.hostId), ...amaRequests.map((a) => a.hostId)])];
  const hosts = await prisma.host.findMany({
    where: { id: { in: hostIds } },
    select: { id: true, name: true, slug: true },
  });
  const byId = Object.fromEntries(hosts.map((h) => [h.id, h]));

  return res.status(200).json({
    submissions: submissions.map((s) => ({ ...s, host: byId[s.hostId] || null })),
    amaRequests: amaRequests.map((a) => ({ ...a, host: byId[a.hostId] || null })),
  });
}
