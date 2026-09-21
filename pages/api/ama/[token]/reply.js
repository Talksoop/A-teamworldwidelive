import { prisma } from "../../../../lib/prisma";
import { getSessionHostId } from "../../../../lib/auth";

export default async function handler(req, res) {
  const hostId = getSessionHostId(req);
  if (!hostId) {
    return res.status(401).json({ error: "Not authorized." });
  }
  if (req.method !== "PATCH") {
    res.setHeader("Allow", ["PATCH"]);
    return res.status(405).end();
  }

  const { token: id } = req.query;
  const existing = await prisma.amaRequest.findUnique({ where: { id } });
  if (!existing || existing.hostId !== hostId) {
    return res.status(404).json({ error: "Not found." });
  }

  const { responseText, responseLink, responseSourceType } = req.body || {};

  if (!responseText && !responseLink) {
    return res.status(400).json({ error: "Add a written reply, a link, or an uploaded file." });
  }

  const updated = await prisma.amaRequest.update({
    where: { id },
    data: {
      responseText: responseText ? responseText.trim() : null,
      responseLink: responseLink ? responseLink.trim() : null,
      responseSourceType: responseLink ? responseSourceType || "LINK" : null,
      status: "ANSWERED",
      answeredAt: new Date(),
    },
  });

  return res.status(200).json(updated);
}
