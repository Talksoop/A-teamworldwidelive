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

  const recommendations = await prisma.radioRecommendation.findMany({
    where: { hostId },
    orderBy: { createdAt: "desc" },
  });
  return res.status(200).json(recommendations);
}
