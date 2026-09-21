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

  const battle = await prisma.battle.findFirst({ where: { hostId: host.id, status: "LIVE" } });
  if (!battle) {
    return res.status(200).json({ battle: null, hostId: host.id });
  }

  const subs = await prisma.submission.findMany({
    where: { id: { in: [battle.songAId, battle.songBId] } },
  });
  const subsWithUrls = await attachPlayUrls(subs);
  const byId = Object.fromEntries(subsWithUrls.map((s) => [s.id, s]));

  return res.status(200).json({
    battle: {
      ...battle,
      songA: byId[battle.songAId] || null,
      songB: byId[battle.songBId] || null,
    },
    hostId: host.id,
  });
}
