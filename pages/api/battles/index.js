import { prisma } from "../../../lib/prisma";
import { getSessionHostId } from "../../../lib/auth";
import { attachPlayUrls } from "../../../lib/s3";
import { broadcastBattleUpdate } from "../../../lib/realtime";

async function withSongs(battles) {
  const ids = [...new Set(battles.flatMap((b) => [b.songAId, b.songBId]))];
  const subs = await prisma.submission.findMany({ where: { id: { in: ids } } });
  const subsWithUrls = await attachPlayUrls(subs);
  const byId = Object.fromEntries(subsWithUrls.map((s) => [s.id, s]));
  return battles.map((b) => ({ ...b, songA: byId[b.songAId] || null, songB: byId[b.songBId] || null }));
}

export default async function handler(req, res) {
  const hostId = getSessionHostId(req);
  if (!hostId) {
    return res.status(401).json({ error: "Not authorized." });
  }

  if (req.method === "GET") {
    const battles = await prisma.battle.findMany({ where: { hostId }, orderBy: { createdAt: "desc" } });
    return res.status(200).json(await withSongs(battles));
  }

  if (req.method === "POST") {
    const { songAId, songBId } = req.body || {};
    if (!songAId || !songBId || songAId === songBId) {
      return res.status(400).json({ error: "Pick two different songs." });
    }
    const [songA, songB] = await Promise.all([
      prisma.submission.findUnique({ where: { id: songAId } }),
      prisma.submission.findUnique({ where: { id: songBId } }),
    ]);
    if (!songA || !songB || songA.hostId !== hostId || songB.hostId !== hostId) {
      return res.status(400).json({ error: "One of those songs isn't yours." });
    }
    const battle = await prisma.battle.create({ data: { hostId, songAId, songBId } });
    broadcastBattleUpdate(hostId);
    return res.status(201).json(battle);
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end();
}
