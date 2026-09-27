import { prisma } from "../../lib/prisma";
import { getHostBySlug } from "../../lib/host";
import { attachPlayUrls } from "../../lib/s3";

const DAY_MS = 24 * 60 * 60 * 1000;

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end();
  }
  const { slug } = req.query;
  const since = new Date(Date.now() - DAY_MS);

  let spotlighted;
  if (slug) {
    // Scoped to one creator's own page.
    const host = await getHostBySlug(slug);
    if (!host) {
      return res.status(404).json({ error: "Channel not found." });
    }
    spotlighted = await prisma.submission.findMany({
      where: { hostId: host.id, spotlightedAt: { gte: since } },
      orderBy: { spotlightedAt: "desc" },
    });
  } else {
    // No slug: the platform-wide Spotlight page -- every creator's current
    // picks, newest first.
    spotlighted = await prisma.submission.findMany({
      where: { spotlightedAt: { gte: since } },
      orderBy: { spotlightedAt: "desc" },
    });
  }

  const hostIds = [...new Set(spotlighted.map((s) => s.hostId))];
  const hosts = hostIds.length
    ? await prisma.host.findMany({
        where: { id: { in: hostIds } },
        select: { id: true, name: true, slug: true },
      })
    : [];
  const hostById = Object.fromEntries(hosts.map((h) => [h.id, h]));

  // Public-facing: strip fields fans shouldn't see (email, internal ids) --
  // but do include which creator spotlighted it, so it can be credited.
  const safe = (await attachPlayUrls(spotlighted)).map((s) => ({
    id: s.id,
    songName: s.songName,
    name: s.name,
    link: s.link,
    sourceType: s.sourceType,
    playUrl: s.playUrl,
    spotlightedAt: s.spotlightedAt,
    host: hostById[s.hostId]
      ? { name: hostById[s.hostId].name, slug: hostById[s.hostId].slug }
      : null,
  }));

  return res.status(200).json(safe);
}
