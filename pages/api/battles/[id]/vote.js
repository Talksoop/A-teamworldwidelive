import { prisma } from "../../../../lib/prisma";
import { broadcastBattleUpdate } from "../../../../lib/realtime";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end();
  }

  const { id } = req.query;
  const { side } = req.body || {};
  if (!["A", "B"].includes(side)) {
    return res.status(400).json({ error: "side must be A or B." });
  }

  const battle = await prisma.battle.findUnique({ where: { id } });
  if (!battle || battle.status !== "LIVE") {
    return res.status(400).json({ error: "That battle isn't live." });
  }

  const updated = await prisma.battle.update({
    where: { id },
    data: side === "A" ? { votesA: { increment: 1 } } : { votesB: { increment: 1 } },
  });

  broadcastBattleUpdate(battle.hostId);
  return res.status(200).json(updated);
}
