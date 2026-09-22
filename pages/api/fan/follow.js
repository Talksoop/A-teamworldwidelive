import { prisma } from "../../../lib/prisma";
import { getSessionFanId } from "../../../lib/fanAuth";

export default async function handler(req, res) {
  const fanId = getSessionFanId(req);
  if (!fanId) {
    return res.status(401).json({ error: "Log in to follow creators." });
  }

  if (req.method === "POST") {
    const { hostId } = req.body || {};
    if (!hostId) return res.status(400).json({ error: "hostId is required." });
    const host = await prisma.host.findUnique({ where: { id: hostId } });
    if (!host) return res.status(404).json({ error: "Channel not found." });

    await prisma.follow.upsert({
      where: { fanId_hostId: { fanId, hostId } },
      update: {},
      create: { fanId, hostId },
    });
    return res.status(200).json({ ok: true, following: true });
  }

  if (req.method === "DELETE") {
    const { hostId } = req.body || {};
    if (!hostId) return res.status(400).json({ error: "hostId is required." });
    await prisma.follow
      .delete({ where: { fanId_hostId: { fanId, hostId } } })
      .catch(() => null);
    return res.status(200).json({ ok: true, following: false });
  }

  res.setHeader("Allow", ["POST", "DELETE"]);
  return res.status(405).end();
}
