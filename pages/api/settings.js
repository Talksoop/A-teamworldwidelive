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
    const {
      submissionMode,
      basePriceCents,
      queueOpen,
      autoApprove,
      freeSubmissionLimit,
      resetFreeCount,
      welcomeMessage,
      bio,
    } = req.body || {};
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
    if (
      typeof freeSubmissionLimit !== "undefined" &&
      (!Number.isInteger(freeSubmissionLimit) || freeSubmissionLimit < 0)
    ) {
      return res.status(400).json({ error: "freeSubmissionLimit must be a non-negative integer." });
    }
    if (typeof welcomeMessage !== "undefined" && typeof welcomeMessage !== "string") {
      return res.status(400).json({ error: "welcomeMessage must be a string." });
    }
    if (typeof welcomeMessage === "string" && welcomeMessage.length > 200) {
      return res.status(400).json({ error: "Welcome message must be 200 characters or fewer." });
    }
    if (typeof bio !== "undefined" && typeof bio !== "string") {
      return res.status(400).json({ error: "bio must be a string." });
    }
    if (typeof bio === "string" && bio.length > 800) {
      return res.status(400).json({ error: "Bio must be 800 characters or fewer." });
    }
    const current = await getOrCreateSettings(hostId);
    // Opening a queue that was closed starts a fresh "session" for the free
    // quota, same as an explicit reset.
    const reopening = queueOpen === true && current.queueOpen === false;
    const updated = await prisma.settings.update({
      where: { hostId },
      data: {
        ...(submissionMode ? { submissionMode } : {}),
        ...(typeof basePriceCents !== "undefined" ? { basePriceCents } : {}),
        ...(typeof queueOpen !== "undefined" ? { queueOpen } : {}),
        ...(typeof autoApprove !== "undefined" ? { autoApprove } : {}),
        ...(typeof freeSubmissionLimit !== "undefined" ? { freeSubmissionLimit } : {}),
        ...(reopening || resetFreeCount ? { freeSubmissionsUsed: 0 } : {}),
        ...(typeof welcomeMessage === "string" ? { welcomeMessage: welcomeMessage.trim() || null } : {}),
        ...(typeof bio === "string" ? { bio: bio.trim() || null } : {}),
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
