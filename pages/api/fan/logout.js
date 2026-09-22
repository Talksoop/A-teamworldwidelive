import { clearFanCookie } from "../../../lib/fanAuth";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end();
  }
  res.setHeader("Set-Cookie", clearFanCookie());
  return res.status(200).json({ ok: true });
}
