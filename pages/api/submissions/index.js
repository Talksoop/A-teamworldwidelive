import { prisma } from "../../../lib/prisma";
import { isAuthed } from "../../../lib/auth";

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
    return res.status(200).json(submissions);
  }

  if (req.method === "POST") {
    // Public submission endpoint.
    const { name, message, link } = req.body || {};

    if (!name || !link) {
      return res.status(400).json({ error: "Name and link are required." });
    }
    if (typeof link !== "string" || !/^https?:\/\//i.test(link.trim())) {
      return res.status(400).json({ error: "Link must be a valid URL." });
    }
    if (name.length > 60 || (message && message.length > 300) || link.length > 500) {
      return res.status(400).json({ error: "One of the fields is too long." });
    }

    const submission = await prisma.submission.create({
      data: {
        name: name.trim(),
        message: message ? message.trim() : null,
        link: link.trim(),
        status: "PENDING",
      },
    });
    return res.status(201).json(submission);
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end(`Method ${req.method} not allowed`);
}
