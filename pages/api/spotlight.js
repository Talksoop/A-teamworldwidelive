import { prisma } from "../../lib/prisma";
import { getHostBySlug } from "../../lib/host";
import { attachPlayUrls } from "../../lib/s3";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end();
  }
  const { slug } = req.query;
  const host = await getHostBySlug(slug);
  if (!host) {
    return res.status(404).json({ error: "Channel not found." });
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const spotlighted = await prisma.submission.findMany({
    where: { hostId: host.id, spotlightedAt: { gte: since } },
    orderBy: { spotlightedAt: "desc" },
  });

  // Public-facing: strip fields fans shouldn't see (email, internal ids).
  const safe = (await attachPlayUrls(spotlighted)).map((s) => ({
    id: s.id,
    songName: s.songName,
    name: s.name,
    link: s.link,
    sourceType: s.sourceType,
    playUrl: s.playUrl,
    spotlightedAt: s.spotlightedAt,
  }));

  return res.status(200).json(safe);
}
