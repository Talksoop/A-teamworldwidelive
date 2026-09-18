import { buffer } from "micro";
import { prisma } from "../../../lib/prisma";
import { getStripe } from "../../../lib/stripe";

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
        let status = "PENDING";
        let order = 0;
        if (submission.skipOfferId) {
          const skipOffer = await prisma.offer.findUnique({
            where: { id: submission.skipOfferId },
          });
          // Higher priority = more negative order = sorts closer to the front.
          status = "QUEUED";
          order = -(skipOffer?.priority || 0);
        }
        await prisma.submission.update({
          where: { id: submissionId },
          data: {
            paid: true,
            status,
            order,
            amountCents: session.amount_total ?? submission.amountCents,
          },
        });
      }
    }
  }

  return res.status(200).json({ received: true });
}
