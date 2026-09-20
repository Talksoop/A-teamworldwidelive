import { prisma } from "../../../lib/prisma";
import { isAuthed } from "../../../lib/auth";
import { broadcastBattleUpdate } from "../../../lib/realtime";

const VALID_STATUSES = ["SCHEDULED", "LIVE", "DONE"];

export default async function handler(req, res) {
  if (!isAuthed(req)) {
    return res.status(401).json({ error: "Not authorized." });
  }

  const { id } = req.query;

  if (req.method === "PATCH") {
    const { status, winnerSide } = req.body || {};
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: "Invalid status." });
    }
    if (winnerSide && !["A", "B"].includes(winnerSide)) {
      return res.status(400).json({ error: "winnerSide must be A or B." });
    }

    // Only one battle may be LIVE at a time.
    if (status === "LIVE") {
      await prisma.battle.updateMany({
        where: { status: "LIVE" },
        data: { status: "DONE" },
      });
    }

    const data = {};
    if (status) data.status = status;
    if (winnerSide) data.winnerSide = winnerSide;

    // Ending the battle without an explicit winner: call it by the votes.
    if (status === "DONE" && !winnerSide) {
      const current = await prisma.battle.findUnique({ where: { id } });
      if (current) {
        data.winnerSide =
          current.votesA === current.votesB ? null : current.votesA > current.votesB ? "A" : "B";
      }
    }

    const updated = await prisma.battle.update({ where: { id }, data });
    broadcastBattleUpdate();
    return res.status(200).json(updated);
  }

  if (req.method === "DELETE") {
    await prisma.battle.delete({ where: { id } });
    broadcastBattleUpdate();
    return res.status(204).end();
  }

  res.setHeader("Allow", ["PATCH", "DELETE"]);
  return res.status(405).end();
}
