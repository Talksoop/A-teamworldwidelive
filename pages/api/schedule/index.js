import { prisma } from "../../../lib/prisma";
import { getSessionHostId } from "../../../lib/auth";

export default async function handler(req, res) {
  const hostId = getSessionHostId(req);
  if (!hostId) {
    return res.status(401).json({ error: "Not authorized." });
  }

  if (req.method === "GET") {
    const events = await prisma.liveEvent.findMany({
      where: { hostId },
      orderBy: { startsAt: "asc" },
    });
    return res.status(200).json(events);
  }

  if (req.method === "POST") {
    const { title, platform, startsAt, url } = req.body || {};
    if (!startsAt) {
      return res.status(400).json({ error: "A date/time is required." });
    }
    const when = new Date(startsAt);
    if (Number.isNaN(when.getTime())) {
      return res.status(400).json({ error: "That date/time isn't valid." });
    }
    if ((title && title.length > 80) || (platform && platform.length > 40) || (url && url.length > 500)) {
      return res.status(400).json({ error: "One of the fields is too long." });
    }

    const event = await prisma.liveEvent.create({
      data: {
        hostId,
        title: title?.trim() || "Going live",
        platform: platform?.trim() || null,
        startsAt: when,
        url: url?.trim() || null,
      },
    });
    return res.status(201).json(event);
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end(`Method ${req.method} not allowed`);
}
