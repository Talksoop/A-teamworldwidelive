import { prisma } from "../../lib/prisma";
import { attachPlayUrls } from "../../lib/s3";

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

  const [playingWithUrl] = playing ? await attachPlayUrls([playing]) : [null];
  const queueWithUrls = await attachPlayUrls(queue);

  return res.status(200).json({ playing: playingWithUrl, queue: queueWithUrls });
}

