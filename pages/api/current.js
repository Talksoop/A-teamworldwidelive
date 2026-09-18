import { prisma } from "../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} not allowed`);
  }

  const playing = await prisma.submission.findFirst({
    where: { status: "PLAYING" },
  });
  const queue = await prisma.submission.findMany({
    where: { status: "QUEUED" },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return res.status(200).json({ playing, queue });
}
