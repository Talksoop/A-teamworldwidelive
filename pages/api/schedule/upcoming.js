import { prisma } from "../../../lib/prisma";
import { getHostBySlug } from "../../../lib/host";

// Public, unauthenticated: the "when creators are going live" calendar.
// - ?slug=xyz  -> that one creator's upcoming events (for their channel page)
// - (no slug)  -> every creator's upcoming events, for the sitewide Discover
//   calendar, each tagged with the creator's name/slug.
export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end();
  }

  const { slug } = req.query;
  const now = new Date();

  if (slug) {
    const host = await getHostBySlug(slug);
    if (!host) {
      return res.status(404).json({ error: "Channel not found." });
    }
    const events = await prisma.liveEvent.findMany({
      where: { hostId: host.id, startsAt: { gte: now } },
      orderBy: { startsAt: "asc" },
      take: 20,
    });
    return res.status(200).json(events);
  }

  const events = await prisma.liveEvent.findMany({
    where: { startsAt: { gte: now } },
    orderBy: { startsAt: "asc" },
    take: 50,
  });
  const hostIds = [...new Set(events.map((e) => e.hostId))];
  const hosts = await prisma.host.findMany({
    where: { id: { in: hostIds } },
    select: { id: true, name: true, slug: true },
  });
  const hostById = Object.fromEntries(hosts.map((h) => [h.id, h]));

  const withHost = events
    .filter((e) => hostById[e.hostId])
    .map((e) => ({ ...e, host: hostById[e.hostId] }));

  return res.status(200).json(withHost);
}
