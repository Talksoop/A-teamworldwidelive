import { getHostBySlug } from "../../lib/host";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end();
  }
  const { slug } = req.query;
  const host = await getHostBySlug(slug);
  if (!host) {
    return res.status(404).json({ error: "Channel not found." });
  }
  return res.status(200).json({ id: host.id, name: host.name, slug: host.slug });
}
