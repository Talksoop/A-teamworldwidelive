import { prisma } from "../../../lib/prisma";
import { getSessionHostId } from "../../../lib/auth";
import { broadcastQueueUpdate } from "../../../lib/realtime";

const VALID_STATUSES = ["PENDING", "QUEUED", "PLAYING", "DONE", "REJECTED"];

export default async function handler(req, res) {
  const hostId = getSessionHostId(req);
  if (!hostId) {
    return res.status(401).json({ error: "Not authorized." });
  }

  const { id } = req.query;
  const existing = await prisma.submission.findUnique({ where: { id } });
  if (!existing || existing.hostId !== hostId) {
    return res.status(404).json({ error: "Not found." });
  }

  if (req.method === "PATCH") {
    const { status, order } = req.body || {};
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: "Invalid status." });
    }

    // Only one submission may be PLAYING at a time (per host): demote any
    // current "now playing" track to DONE before promoting the new one.
    if (status === "PLAYING") {
      await prisma.submission.updateMany({
        where: { hostId, status: "PLAYING" },
        data: { status: "DONE" },
      });
    }

    const updated = await prisma.submission.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(typeof order === "number" ? { order } : {}),
      },
    });
    broadcastQueueUpdate(hostId);
    return res.status(200).json(updated);
  }

  if (req.method === "DELETE") {
    await prisma.submission.delete({ where: { id } });
    broadcastQueueUpdate(hostId);
    return res.status(204).end();
  }

  res.setHeader("Allow", ["PATCH", "DELETE"]);
  return res.status(405).end(`Method ${req.method} not allowed`);
}
