import { prisma } from "../../../lib/prisma";
import { getSessionHostId } from "../../../lib/auth";
import { getHostBySlug } from "../../../lib/host";
import { attachPlayUrls } from "../../../lib/s3";
import { broadcastQueueUpdate } from "../../../lib/realtime";
import { rateLimited } from "../../../lib/rateLimit";
import { notifyHostNewSubmission } from "../../../lib/notifications";

export default async function handler(req, res) {
  if (req.method === "GET") {
    // Admin-only: full submission list including names/messages, scoped to
    // the logged-in host.
    const hostId = getSessionHostId(req);
    if (!hostId) {
      return res.status(401).json({ error: "Not authorized." });
    }
    const { status } = req.query;
    const submissions = await prisma.submission.findMany({
      where: status ? { hostId, status } : { hostId },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });
    return res.status(200).json(await attachPlayUrls(submissions));
  }

  if (req.method === "POST") {
    if (rateLimited(req, res, "submit", { windowMs: 10 * 60 * 1000, max: 15 })) return;
    // Public submission endpoint — the fan's page is at /h/[slug]/submit.
    const { slug, name, email, songName, message, link, sourceType } = req.body || {};
    const isUpload = sourceType === "UPLOAD";

    const host = await getHostBySlug(slug);
    if (!host) {
      return res.status(404).json({ error: "Channel not found." });
    }

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
      link.length > 500 ||
      (email && email.length > 200)
    ) {
      return res.status(400).json({ error: "One of the fields is too long." });
    }

    const submission = await prisma.submission.create({
      data: {
        hostId: host.id,
        name: name.trim(),
        email: email ? email.trim() : null,
        songName: songName.trim(),
        message: message ? message.trim() : null,
        link: link.trim(),
        sourceType: isUpload ? "UPLOAD" : "LINK",
        status: "PENDING",
      },
    });
    broadcastQueueUpdate(host.id);
    notifyHostNewSubmission(host, submission);
    return res.status(201).json(submission);
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end(`Method ${req.method} not allowed`);
}
