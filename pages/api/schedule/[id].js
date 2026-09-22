import { prisma } from "../../../lib/prisma";
import { getSessionHostId } from "../../../lib/auth";

export default async function handler(req, res) {
  const hostId = getSessionHostId(req);
  if (!hostId) {
    return res.status(401).json({ error: "Not authorized." });
  }

  const { id } = req.query;
  const existing = await prisma.liveEvent.findUnique({ where: { id } });
  if (!existing || existing.hostId !== hostId) {
    return res.status(404).json({ error: "Not found." });
  }

  if (req.method === "DELETE") {
    await prisma.liveEvent.delete({ where: { id } });
    return res.status(204).end();
  }

  res.setHeader("Allow", ["DELETE"]);
  return res.status(405).end(`Method ${req.method} not allowed`);
}
