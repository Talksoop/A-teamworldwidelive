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

  const follows = await prisma.follow.findMany({
    where: { fanId },
    orderBy: { createdAt: "desc" },
  });
  const hosts = await prisma.host.findMany({
    where: { id: { in: follows.map((f) => f.hostId) } },
    select: { id: true, name: true, slug: true },
  });
  const byId = Object.fromEntries(hosts.map((h) => [h.id, h]));

  return res.status(200).json(
    follows.map((f) => byId[f.hostId]).filter(Boolean)
  );
}
