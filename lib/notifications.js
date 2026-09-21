import { prisma } from "./prisma";
import { sendEmail } from "./email";

function fmt(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

export async function notifyHostNewSubmission(host, submission) {
  await sendEmail({
    to: host.email,
    subject: `New submission: "${submission.songName || "Untitled"}"`,
    text: `${submission.name} just submitted "${submission.songName || "a track"}".${
      submission.paid ? ` Paid ${fmt(submission.amountCents)}.` : ""
    }\n\nReview it in your admin dashboard.`,
  });
}

export async function notifyHostNewAma(host, request) {
  await sendEmail({
    to: host.email,
    subject: `New private request from ${request.name}`,
    text: `${request.name} sent you a private request:\n\n"${request.question}"\n${
      request.paid ? `\nPaid ${fmt(request.amountCents)}.` : ""
    }\n\nReply from your AMA Inbox in admin.`,
  });
}

export async function notifyFounderNewHost(newHost) {
  const founder = await prisma.host.findFirst({ where: { isFounder: true } });
  if (!founder) return;
  await sendEmail({
    to: founder.email,
    subject: `New channel signed up: ${newHost.name}`,
    text: `${newHost.name} (${newHost.email}) just created a channel at /h/${newHost.slug}.`,
  });
}

export async function notifyFanAmaAnswered(request) {
  if (!request.email) return;
  await sendEmail({
    to: request.email,
    subject: "You got a reply to your request",
    text: `Your question was answered:\n\n"${request.question}"\n\nView the reply: check the link you saved when you submitted, or visit your request page again.`,
  });
}

export async function notifyFanSongPlaying(submission) {
  if (!submission.email) return;
  await sendEmail({
    to: submission.email,
    subject: `Your song "${submission.songName || "your track"}" is playing now!`,
    text: `It's live right now. Tune in!`,
  });
}

export async function notifyHostPayout(host, amountCents) {
  await sendEmail({
    to: host.email,
    subject: `Payout sent: ${fmt(amountCents)}`,
    text: `Stripe just sent a payout of ${fmt(amountCents)} to your connected account. It should land in your bank shortly, per Stripe's usual payout schedule.`,
  });
}
