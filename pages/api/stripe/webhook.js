import { buffer } from "micro";
import { prisma } from "../../../lib/prisma";
import { getStripe } from "../../../lib/stripe";
import { broadcastQueueUpdate } from "../../../lib/realtime";

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end();
  }

  const sig = req.headers["stripe-signature"];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set.");
    return res.status(500).end();
  }

  let event;
  try {
    const buf = await buffer(req);
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(buf, sig, secret);
  } catch (err) {
    return res.status(400).send(`Webhook signature verification failed.`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const submissionId = session.metadata?.submissionId;
    if (submissionId) {
      const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
      if (submission && submission.status === "PENDING_PAYMENT") {
        // Paid means paid: skip the manual review step entirely and drop
        // straight into the queue. A skip offer's priority still determines
        // how far toward the front it lands; a plain paid entry (or a
        // react-only purchase) just joins the back of the queue normally.
        let order = 0;
        if (submission.skipOfferId) {
          const skipOffer = await prisma.offer.findUnique({
            where: { id: submission.skipOfferId },
          });
          order = -(skipOffer?.priority || 0);
        }
        await prisma.submission.update({
          where: { id: submissionId },
          data: {
            paid: true,
            status: "QUEUED",
            order,
            amountCents: session.amount_total ?? submission.amountCents,
          },
        });
        broadcastQueueUpdate();
      }
    }
  }

  return res.status(200).json({ received: true });
}
