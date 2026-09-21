import crypto from "crypto";
import { prisma } from "../../lib/prisma";
import { getStripe } from "../../lib/stripe";
import { getSessionHostId } from "../../lib/auth";
import { getHostBySlug } from "../../lib/host";
import { rateLimited } from "../../lib/rateLimit";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const hostId = getSessionHostId(req);
    if (!hostId) {
      return res.status(401).json({ error: "Not authorized." });
    }
    const requests = await prisma.amaRequest.findMany({
      where: { hostId, status: { in: ["PENDING", "ANSWERED"] } },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json(requests);
  }

  if (req.method === "POST") {
    if (rateLimited(req, res, "ama", { windowMs: 60 * 60 * 1000, max: 8 })) return;
    const { slug, name, question, link } = req.body || {};
    if (!name || !question) {
      return res.status(400).json({ error: "Name and question are required." });
    }
    if (name.length > 60 || question.length > 1000 || (link && link.length > 500)) {
      return res.status(400).json({ error: "One of the fields is too long." });
    }

    const host = await getHostBySlug(slug);
    if (!host) {
      return res.status(404).json({ error: "Channel not found." });
    }

    const settings = await prisma.settings.upsert({
      where: { hostId: host.id },
      update: {},
      create: { hostId: host.id },
    });
    if (!settings.amaEnabled) {
      return res.status(400).json({ error: "AMA requests aren't open right now." });
    }

    const accessToken = crypto.randomUUID();
    const priceCents = settings.amaPriceCents;

    if (priceCents === 0) {
      await prisma.amaRequest.create({
        data: {
          hostId: host.id,
          name: name.trim(),
          question: question.trim(),
          link: link ? link.trim() : null,
          accessToken,
          status: "PENDING",
          paid: false,
        },
      });
      return res.status(201).json({ free: true, token: accessToken });
    }

    if (!host.isFounder && !host.stripeOnboarded) {
      return res.status(400).json({ error: "This channel hasn't set up payments yet." });
    }

    const request = await prisma.amaRequest.create({
      data: {
        hostId: host.id,
        name: name.trim(),
        question: question.trim(),
        link: link ? link.trim() : null,
        accessToken,
        status: "PENDING_PAYMENT",
        paid: false,
        amountCents: priceCents,
      },
    });

    const origin = req.headers.origin || `https://${req.headers.host}`;
    const paymentIntentData = host.isFounder
      ? undefined
      : {
          application_fee_amount: Math.round((priceCents * host.platformFeeBps) / 10000),
          transfer_data: { destination: host.stripeAccountId },
        };

    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: priceCents,
              product_data: { name: "Private AMA / review request" },
            },
            quantity: 1,
          },
        ],
        payment_intent_data: paymentIntentData,
        success_url: `${origin}/h/${host.slug}/ama/${accessToken}?paid=1`,
        cancel_url: `${origin}/h/${host.slug}/ama?canceled=1`,
        metadata: { amaId: request.id, hostId: host.id },
      });
      await prisma.amaRequest.update({
        where: { id: request.id },
        data: { stripeSessionId: session.id },
      });
      return res.status(200).json({ free: false, url: session.url });
    } catch (err) {
      await prisma.amaRequest.delete({ where: { id: request.id } });
      return res.status(500).json({ error: "Couldn't start checkout. Try again." });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end();
}
