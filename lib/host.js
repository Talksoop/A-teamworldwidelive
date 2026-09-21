import { prisma } from "./prisma";

export async function getHostBySlug(slug) {
  if (!slug) return null;
  return prisma.host.findUnique({ where: { slug } });
}

export function slugify(input) {
  return (input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}
