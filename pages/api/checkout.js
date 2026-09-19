import { prisma } from "../../lib/prisma";
import { getStripe } from "../../lib/stripe";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end();
  }

  const { name, songName, link, message, sourceType, skipOfferId, reactOfferId } = req.body || {};
  const isUpload = sourceType === "UPLOAD";

  if (!name || !link || !songName) {
    return res.status(400).json({ error: "Name, song name, and link are required." });
  }
  if (!isUpload && (typeof link !== "string" || !/^https?:\/\//i.test(link.trim()))) {
    return res.status(400).json({ error: "Link must be a valid URL." });
  }
  if (
    name.length > 60 ||
    songName.length > 100 ||
    (message && message.length > 300) ||
    link.length > 500
  ) {
    return res.status(400).json({ error: "One of the fields is too long." });
  }

  const settings = await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });

  let skipOffer = null;
  let reactOffer = null;
  if (skipOfferId) {
    skipOffer = await prisma.offer.findUnique({ where: { id: skipOfferId } });
    if (!skipOffer || skipOffer.type !== "SKIP" || !skipOffer.active) {
      return res.status(400).json({ error: "That skip offer isn't available." });
    }
  }
  if (reactOfferId) {
    reactOffer = await prisma.offer.findUnique({ where: { id: reactOfferId } });
    if (!reactOffer || reactOffer.type !== "REACT" || !reactOffer.active) {
      return res.status(400).json({ error: "That react offer isn't available." });
    }
  }

  const basePriceCents = settings.submissionMode === "PAID" ? settings.basePriceCents : 0;
  const totalCents = basePriceCents + (skipOffer?.priceCents || 0) + (reactOffer?.priceCents || 0);

  const data = {
    name: name.trim(),
    songName: songName.trim(),
    message: message ? message.trim() : null,
    link: link.trim(),
    sourceType: isUpload ? "UPLOAD" : "LINK",
    skipOfferId: skipOffer?.id || null,
    reactOfferId: reactOffer?.id || null,
    amountCents: totalCents,
  };

  if (totalCents === 0) {
    // Nothing to charge: create it straight into the normal review queue.
    const submission = await prisma.submission.create({
      data: { ...data, status: "PENDING", paid: false },
    });
    return res.status(201).json({ free: true, submission });
  }

  // Paid: hold the submission until payment confirms via webhook.
  const submission = await prisma.submission.create({
    data: { ...data, status: "PENDING_PAYMENT", paid: false },
  });

  const origin = req.headers.origin || `https://${req.headers.host}`;
  const lineItems = [];
  if (basePriceCents > 0) {
    lineItems.push({
      price_data: {
        currency: "usd",
        unit_amount: basePriceCents,
        product_data: { name: "Track submission" },
      },
      quantity: 1,
    });
  }
  if (skipOffer) {
    lineItems.push({
      price_data: {
        currency: "usd",
        unit_amount: skipOffer.priceCents,
        product_data: {
          name: skipOffer.name,
          description: skipOffer.description || undefined,
        },
      },
      quantity: 1,
    });
  }
  if (reactOffer) {
    lineItems.push({
      price_data: {
        currency: "usd",
        unit_amount: reactOffer.priceCents,
        product_data: {
          name: reactOffer.name,
          description: reactOffer.description || undefined,
        },
      },
      quantity: 1,
    });
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${origin}/submit?paid=1&submission=${submission.id}`,
      cancel_url: `${origin}/submit?canceled=1`,
      metadata: { submissionId: submission.id },
    });

    await prisma.submission.update({
      where: { id: submission.id },
      data: { stripeSessionId: session.id },
    });

    return res.status(200).json({ free: false, url: session.url });
  } catch (err) {
    await prisma.submission.delete({ where: { id: submission.id } });
    return res.status(500).json({ error: "Couldn't start checkout. Try again." });
  }
}
