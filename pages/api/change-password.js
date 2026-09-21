import { prisma } from "../../lib/prisma";
import { getSessionHostId, hashPassword, verifyPassword } from "../../lib/auth";

export default async function handler(req, res) {
  const hostId = getSessionHostId(req);
  if (!hostId) {
    return res.status(401).json({ error: "Not authorized." });
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end();
  }

  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Enter your current and new password." });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: "New password must be at least 8 characters." });
  }

  const host = await prisma.host.findUnique({ where: { id: hostId } });
  if (!host || !(await verifyPassword(currentPassword, host.passwordHash))) {
    return res.status(401).json({ error: "Current password is wrong." });
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.host.update({ where: { id: hostId }, data: { passwordHash } });

  return res.status(200).json({ ok: true });
}
