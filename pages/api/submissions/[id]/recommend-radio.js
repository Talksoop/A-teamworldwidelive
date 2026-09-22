import { prisma } from "../../../../lib/prisma";
import { getSessionHostId } from "../../../../lib/auth";
import { sendEmail } from "../../../../lib/email";

const RADIO_SUBMIT_URL = "https://connectdivamedia.com/radio/submit";

function radioInviteEmail(submission) {
  const name = submission.name?.trim() || "there";
  const songName = submission.songName?.trim() || "your track";
  return {
    subject: "Your song got recommended for radio!",
    text: `Hey ${name},

Good news — your track "${songName}" caught the host's ear, and they've recommended it for radio play through Connect Diva Media.

To be considered, submit your song directly here:
${RADIO_SUBMIT_URL}

That's the official radio submission page, so make sure to send it in there to get it into rotation.

Thanks for sharing your music with us — keep it coming!

— A-Team Worldwide Live`,
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end();
  }

  const hostId = getSessionHostId(req);
  if (!hostId) {
    return res.status(401).json({ error: "Not authorized." });
  }

  const { id } = req.query;
  const submission = await prisma.submission.findUnique({ where: { id } });
  if (!submission || submission.hostId !== hostId) {
    return res.status(404).json({ error: "Not found." });
  }

  // Idempotent: recommending twice just returns the existing record rather
  // than sending a second email.
  const existing = await prisma.radioRecommendation.findUnique({
    where: { submissionId: submission.id },
  });
  if (existing) {
    return res.status(200).json(existing);
  }

  const willEmail = Boolean(submission.email);
  const recommendation = await prisma.radioRecommendation.create({
    data: {
      hostId,
      submissionId: submission.id,
      fanId: submission.fanId,
      name: submission.name,
      email: submission.email,
      songName: submission.songName,
      link: submission.link,
      emailSent: willEmail,
    },
  });

  if (willEmail) {
    const { subject, text } = radioInviteEmail(submission);
    await sendEmail({ to: submission.email, subject, text });
  }

  return res.status(201).json(recommendation);
}
