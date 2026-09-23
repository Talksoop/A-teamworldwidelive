import { prisma } from "../../lib/prisma";
import { getSessionHostId } from "../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end();
  }
  const hostId = getSessionHostId(req);
  if (!hostId) {
    return res.status(401).json({ error: "Not authorized." });
  }

  const follows = await prisma.follow.findMany({
    where: { hostId },
    orderBy: { createdAt: "desc" },
  });
  const fans = await prisma.fan.findMany({
    where: { id: { in: follows.map((f) => f.fanId) } },
    select: { id: true, name: true, email: true },
  });
  const byId = Object.fromEntries(fans.map((f) => [f.id, f]));

  const followers = follows
    .map((f) => {
      const fan = byId[f.fanId];
      if (!fan) return null;
      return { id: fan.id, name: fan.name, email: fan.email, followedAt: f.createdAt };
    })
    .filter(Boolean);

  return res.status(200).json({ count: followers.length, followers });
}
