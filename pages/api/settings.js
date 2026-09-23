import { prisma } from "../../lib/prisma";
import { getSessionHostId } from "../../lib/auth";
import { getHostBySlug } from "../../lib/host";
import { broadcastSettingsUpdate } from "../../lib/realtime";

async function getOrCreateSettings(hostId) {
  return prisma.settings.upsert({
    where: { hostId },
    update: {},
    create: { hostId },
  });
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    // Public callers pass ?slug=... . Admin's own dashboard has no slug in
    // scope, so falls back to the session's hostId instead.
    const { slug } = req.query;
    let hostId;
    if (slug) {
      const host = await getHostBySlug(slug);
      if (!host) {
        return res.status(404).json({ error: "Channel not found." });
      }
      hostId = host.id;
    } else {
      hostId = getSessionHostId(req);
      if (!hostId) {
        return res.status(401).json({ error: "Not authorized." });
      }
    }
    const settings = await getOrCreateSettings(hostId);
    return res.status(200).json(settings);
  }

  if (req.method === "PATCH") {
    const hostId = getSessionHostId(req);
    if (!hostId) {
      return res.status(401).json({ error: "Not authorized." });
    }
    const { submissionMode, basePriceCents, queueOpen, autoApprove } = req.body || {};
    if (submissionMode && !["FREE", "PAID"].includes(submissionMode)) {
      return res.status(400).json({ error: "Invalid submissionMode." });
    }
    if (
      typeof basePriceCents !== "undefined" &&
      (!Number.isInteger(basePriceCents) || basePriceCents < 0)
    ) {
      return res.status(400).json({ error: "basePriceCents must be a non-negative integer." });
    }
    if (typeof queueOpen !== "undefined" && typeof queueOpen !== "boolean") {
      return res.status(400).json({ error: "queueOpen must be true or false." });
    }
    if (typeof autoApprove !== "undefined" && typeof autoApprove !== "boolean") {
      return res.status(400).json({ error: "autoApprove must be true or false." });
    }
    await getOrCreateSettings(hostId);
    const updated = await prisma.settings.update({
      where: { hostId },
      data: {
        ...(submissionMode ? { submissionMode } : {}),
        ...(typeof basePriceCents !== "undefined" ? { basePriceCents } : {}),
        ...(typeof queueOpen !== "undefined" ? { queueOpen } : {}),
        ...(typeof autoApprove !== "undefined" ? { autoApprove } : {}),
      },
    });
    // Push to any fan submit/channel page that's already open so pricing,
    // mode, and open/closed status change live without a manual refresh.
    broadcastSettingsUpdate(hostId);
    return res.status(200).json(updated);
  }

  res.setHeader("Allow", ["GET", "PATCH"]);
  return res.status(405).end();
}
