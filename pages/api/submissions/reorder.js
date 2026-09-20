import { prisma } from "../../../lib/prisma";
import { isAuthed } from "../../../lib/auth";
import { broadcastQueueUpdate } from "../../../lib/realtime";

export default async function handler(req, res) {
  if (!isAuthed(req)) {
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

  await prisma.$transaction(
    order.map((id, index) =>
      prisma.submission.update({ where: { id }, data: { order: index } })
    )
  );

  broadcastQueueUpdate();
  return res.status(200).json({ ok: true });
}
