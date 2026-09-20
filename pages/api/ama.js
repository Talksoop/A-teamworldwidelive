import crypto from "crypto";
import { prisma } from "../../lib/prisma";
import { getStripe } from "../../lib/stripe";
import { isAuthed } from "../../lib/auth";

export default async function handler(req, res) {
  if (req.method === "GET") {
    if (!isAuthed(req)) {
      return res.status(401).json({ error: "Not authorized." });
    }
    const requests = await prisma.amaRequest.findMany({
      where: { status: { in: ["PENDING", "ANSWERED"] } },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json(requests);
  }

  if (req.method === "POST") {
    const { name, question, link } = req.body || {};
    if (!name || !question) {
      return res.status(400).json({ error: "Name and question are required." });
    }
    if (name.length > 60 || question.length > 1000 || (link && link.length > 500)) {
      return res.status(400).json({ error: "One of the fields is too long." });
    }

    const settings = await prisma.settings.upsert({
      where: { id: "singleton" },
      update: {},
      create: { id: "singleton" },
    });
    if (!settings.amaEnabled) {
      return res.status(400).json({ error: "AMA requests aren't open right now." });
    }

    const accessToken = crypto.randomUUID();
    const priceCents = settings.amaPriceCents;

    if (priceCents === 0) {
      await prisma.amaRequest.create({
        data: {
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

    const request = await prisma.amaRequest.create({
      data: {
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
        success_url: `${origin}/ama/${accessToken}?paid=1`,
        cancel_url: `${origin}/ama?canceled=1`,
        metadata: { amaId: request.id },
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
