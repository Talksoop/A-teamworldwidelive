import { prisma } from "../../../lib/prisma";
import { getSessionHostId } from "../../../lib/auth";
import { broadcastBattleUpdate } from "../../../lib/realtime";

const VALID_STATUSES = ["SCHEDULED", "LIVE", "DONE"];

export default async function handler(req, res) {
  const hostId = getSessionHostId(req);
  if (!hostId) {
    return res.status(401).json({ error: "Not authorized." });
  }

  const { id } = req.query;
  const existing = await prisma.battle.findUnique({ where: { id } });
  if (!existing || existing.hostId !== hostId) {
    return res.status(404).json({ error: "Not found." });
  }

  if (req.method === "PATCH") {
    const { status, winnerSide } = req.body || {};
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: "Invalid status." });
    }
    if (winnerSide && !["A", "B"].includes(winnerSide)) {
      return res.status(400).json({ error: "winnerSide must be A or B." });
    }

    // Only one battle may be LIVE at a time, per host.
    if (status === "LIVE") {
      await prisma.battle.updateMany({
        where: { hostId, status: "LIVE" },
        data: { status: "DONE" },
      });
    }

    const data = {};
    if (status) data.status = status;
    if (winnerSide) data.winnerSide = winnerSide;

    // Ending the battle without an explicit winner: call it by the votes.
    if (status === "DONE" && !winnerSide) {
      data.winnerSide =
        existing.votesA === existing.votesB ? null : existing.votesA > existing.votesB ? "A" : "B";
    }

    const updated = await prisma.battle.update({ where: { id }, data });
    broadcastBattleUpdate(hostId);
    return res.status(200).json(updated);
  }

  if (req.method === "DELETE") {
    await prisma.battle.delete({ where: { id } });
    broadcastBattleUpdate(hostId);
    return res.status(204).end();
  }

  res.setHeader("Allow", ["PATCH", "DELETE"]);
  return res.status(405).end();
}
