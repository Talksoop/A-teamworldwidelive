import { prisma } from "../../../lib/prisma";
import { isAuthed } from "../../../lib/auth";
import { attachPlayUrls } from "../../../lib/s3";
import { broadcastQueueUpdate } from "../../../lib/realtime";

export default async function handler(req, res) {
  if (req.method === "GET") {
    // Admin-only: full submission list including names/messages.
    if (!isAuthed(req)) {
      return res.status(401).json({ error: "Not authorized." });
    }
    const { status } = req.query;
    const submissions = await prisma.submission.findMany({
      where: status ? { status } : undefined,
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });
    return res.status(200).json(await attachPlayUrls(submissions));
  }

  if (req.method === "POST") {
    // Public submission endpoint.
    const { name, songName, message, link, sourceType } = req.body || {};
    const isUpload = sourceType === "UPLOAD";

    if (!name || !link || !songName) {
      return res.status(400).json({ error: "Name, song name, and link are required." });
    }
    if (!isUpload && (typeof link !== "string" || !/^https?:\/\//i.test(link.trim()))) {
      return res.status(400).json({ error: "Link must be a valid URL." });
    }
    if (
      name.length > 60 ||
      songName.length > 100 ||
      (message && message.length > 300) ||
      link.length > 500
    ) {
      return res.status(400).json({ error: "One of the fields is too long." });
    }

    const submission = await prisma.submission.create({
      data: {
        name: name.trim(),
        songName: songName.trim(),
        message: message ? message.trim() : null,
        link: link.trim(),
        sourceType: isUpload ? "UPLOAD" : "LINK",
        status: "PENDING",
      },
    });
    broadcastQueueUpdate();
    return res.status(201).json(submission);
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end(`Method ${req.method} not allowed`);
}
