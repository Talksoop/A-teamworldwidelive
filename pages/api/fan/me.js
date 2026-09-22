import { prisma } from "../../../lib/prisma";
import { getSessionFanId } from "../../../lib/fanAuth";

export default async function handler(req, res) {
  const fanId = getSessionFanId(req);
  if (!fanId) {
    return res.status(401).json({ error: "Not logged in." });
  }
  const fan = await prisma.fan.findUnique({ where: { id: fanId } });
  if (!fan) {
    return res.status(401).json({ error: "Not logged in." });
  }
  return res.status(200).json({ id: fan.id, name: fan.name, email: fan.email });
}
