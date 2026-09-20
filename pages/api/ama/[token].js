import { prisma } from "../../../lib/prisma";
import { presignIfUpload } from "../../../lib/s3";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end();
  }

  const { token } = req.query;
  const request = await prisma.amaRequest.findUnique({ where: { accessToken: token } });
  if (!request) {
    return res.status(404).json({ error: "Not found." });
  }

  const responsePlayUrl = await presignIfUpload(request.responseSourceType, request.responseLink);

  return res.status(200).json({
    id: request.id,
    name: request.name,
    question: request.question,
    link: request.link,
    status: request.status,
    paid: request.paid,
    responseText: request.responseText,
    responseLink: request.responseLink,
    responseSourceType: request.responseSourceType,
    responsePlayUrl,
    answeredAt: request.answeredAt,
    createdAt: request.createdAt,
  });
}
