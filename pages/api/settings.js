import { prisma } from "../../lib/prisma";
import { isAuthed } from "../../lib/auth";

async function getSettings() {
  const settings = await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
  return settings;
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    // Public: the submit page needs this to know whether to show pricing.
    const settings = await getSettings();
    return res.status(200).json(settings);
  }

  if (req.method === "PATCH") {
    if (!isAuthed(req)) {
      return res.status(401).json({ error: "Not authorized." });
    }
    const { submissionMode, basePriceCents } = req.body || {};
    if (submissionMode && !["FREE", "PAID"].includes(submissionMode)) {
      return res.status(400).json({ error: "Invalid submissionMode." });
    }
    if (
      typeof basePriceCents !== "undefined" &&
      (!Number.isInteger(basePriceCents) || basePriceCents < 0)
    ) {
      return res.status(400).json({ error: "basePriceCents must be a non-negative integer." });
    }
    await getSettings();
    const updated = await prisma.settings.update({
      where: { id: "singleton" },
      data: {
        ...(submissionMode ? { submissionMode } : {}),
        ...(typeof basePriceCents !== "undefined" ? { basePriceCents } : {}),
      },
    });
    return res.status(200).json(updated);
  }

  res.setHeader("Allow", ["GET", "PATCH"]);
  return res.status(405).end();
}
