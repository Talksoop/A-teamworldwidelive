import { prisma } from "../../../lib/prisma";
import { getSessionHostId } from "../../../lib/auth";
import { broadcastQueueUpdate } from "../../../lib/realtime";

export default async function handler(req, res) {
  const hostId = getSessionHostId(req);
  if (!hostId) {
    return res.status(401).json({ error: "Not authorized." });
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end();
  }

  const { order } = req.body || {}; // array of submission ids, in the desired order
  if (!Array.isArray(order) || order.some((id) => typeof id !== "string")) {
    return res.status(400).json({ error: "order must be an array of submission ids." });
  }

  // Verify every id actually belongs to this host before touching anything.
  const owned = await prisma.submission.findMany({
    where: { id: { in: order }, hostId },
    select: { id: true },
  });
  if (owned.length !== order.length) {
    return res.status(403).json({ error: "One or more of those songs isn't yours." });
  }

  await prisma.$transaction(
    order.map((id, index) =>
      prisma.submission.update({ where: { id }, data: { order: index } })
    )
  );

  broadcastQueueUpdate(hostId);
  return res.status(200).json({ ok: true });
}
