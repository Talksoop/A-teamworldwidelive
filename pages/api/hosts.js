import { prisma } from "../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end();
  }
  const hosts = await prisma.host.findMany({
    select: { id: true, name: true, slug: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  return res.status(200).json(hosts);
}
