import { checkPassword, authCookie } from "../../lib/auth";

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end();
  }

  const { password } = req.body || {};
  if (!checkPassword(password)) {
    return res.status(401).json({ error: "Wrong password." });
  }

  res.setHeader("Set-Cookie", authCookie());
  return res.status(200).json({ ok: true });
}
