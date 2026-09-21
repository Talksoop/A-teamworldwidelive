import { prisma } from "../../lib/prisma";
import { getSessionHostId } from "../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end();
  }
  const hostId = getSessionHostId(req);
  if (!hostId) {
    return res.status(401).json({ error: "Not authorized." });
  }
  const host = await prisma.host.findUnique({ where: { id: hostId } });
  if (!host) {
    return res.status(404).json({ error: "Not found." });
  }
  return res.status(200).json({
    id: host.id,
    email: host.email,
    name: host.name,
    slug: host.slug,
    platformFeeBps: host.platformFeeBps,
    stripeOnboarded: host.stripeOnboarded,
    isFounder: host.isFounder,
  });
}
