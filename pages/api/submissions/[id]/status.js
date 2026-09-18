import { prisma } from "../../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end();
  }

  const { id } = req.query;
  const submission = await prisma.submission.findUnique({ where: { id } });
  if (!submission) {
    return res.status(404).json({ error: "Not found." });
  }

  let bonusRemaining = 0;
  if (submission.paid && submission.skipOfferId) {
    const offer = await prisma.offer.findUnique({ where: { id: submission.skipOfferId } });
    if (offer?.bonusSubmissions > 0) {
      const used = await prisma.submission.count({
        where: { parentSubmissionId: submission.id },
      });
      bonusRemaining = Math.max(0, offer.bonusSubmissions - used);
    }
  }

  return res.status(200).json({
    id: submission.id,
    paid: submission.paid,
    status: submission.status,
    bonusRemaining,
  });
}
