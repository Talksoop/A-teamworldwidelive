import { prisma } from "../../lib/prisma";
import { attachPlayUrls } from "../../lib/s3";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end();
  }

  const battle = await prisma.battle.findFirst({ where: { status: "LIVE" } });
  if (!battle) {
    return res.status(200).json({ battle: null });
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
  });
}
