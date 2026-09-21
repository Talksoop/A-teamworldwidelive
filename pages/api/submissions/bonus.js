import { prisma } from "../../../lib/prisma";
import { broadcastQueueUpdate } from "../../../lib/realtime";
import { rateLimited } from "../../../lib/rateLimit";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end();
  }
  if (rateLimited(req, res, "bonus", { windowMs: 10 * 60 * 1000, max: 15 })) return;

  const { parentId, name, songName, link, message, sourceType } = req.body || {};
  const isUpload = sourceType === "UPLOAD";

  if (!parentId || !name || !link || !songName) {
    return res.status(400).json({ error: "Missing required fields." });
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

  const parent = await prisma.submission.findUnique({ where: { id: parentId } });
  if (!parent || !parent.paid || !parent.skipOfferId) {
    return res.status(400).json({ error: "That submission isn't eligible for a bonus song." });
  }

  const offer = await prisma.offer.findUnique({ where: { id: parent.skipOfferId } });
  if (!offer || offer.bonusSubmissions <= 0) {
    return res.status(400).json({ error: "That tier doesn't include a bonus song." });
  }

  const used = await prisma.submission.count({ where: { parentSubmissionId: parent.id } });
  if (used >= offer.bonusSubmissions) {
    return res.status(400).json({ error: "The bonus song for this purchase has already been used." });
  }

  const bonus = await prisma.submission.create({
    data: {
      hostId: parent.hostId,
      name: name.trim(),
      songName: songName.trim(),
      message: message ? message.trim() : null,
      link: link.trim(),
      sourceType: isUpload ? "UPLOAD" : "LINK",
      status: parent.status, // matches the parent's placement (e.g. QUEUED)
      order: parent.order, // same jump treatment
      paid: true,
      amountCents: 0, // already covered by the parent purchase
      skipOfferId: parent.skipOfferId,
      parentSubmissionId: parent.id,
    },
  });

  broadcastQueueUpdate(parent.hostId);
  return res.status(201).json(bonus);
}
