import { prisma } from "../../lib/prisma";
import { getStripe } from "../../lib/stripe";
import { getHostBySlug } from "../../lib/host";
import { broadcastQueueUpdate } from "../../lib/realtime";
import { rateLimited } from "../../lib/rateLimit";
import { notifyHostNewSubmission } from "../../lib/notifications";
import { getSessionFanId } from "../../lib/fanAuth";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end();
  }
  if (rateLimited(req, res, "checkout", { windowMs: 10 * 60 * 1000, max: 15 })) return;

  const { slug, name, email, songName, link, message, sourceType, skipOfferId, reactOfferId } =
    req.body || {};
  const isUpload = sourceType === "UPLOAD";

  const host = await getHostBySlug(slug);
  if (!host) {
    return res.status(404).json({ error: "Channel not found." });
  }

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
    where: { hostId: host.id },
    update: {},
    create: { hostId: host.id },
  });

  if (!settings.queueOpen) {
    return res.status(400).json({ error: "This channel isn't taking submissions right now." });
  }

  let skipOffer = null;
  let reactOffer = null;
  if (skipOfferId) {
    skipOffer = await prisma.offer.findUnique({ where: { id: skipOfferId } });
    if (!skipOffer || skipOffer.hostId !== host.id || skipOffer.type !== "SKIP" || !skipOffer.active) {
      return res.status(400).json({ error: "That skip offer isn't available." });
    }
  }
  if (reactOfferId) {
    reactOffer = await prisma.offer.findUnique({ where: { id: reactOfferId } });
    if (
      !reactOffer ||
      reactOffer.hostId !== host.id ||
      reactOffer.type !== "REACT" ||
      !reactOffer.active
    ) {
      return res.status(400).json({ error: "That react offer isn't available." });
    }
  }

  const basePriceCents = settings.submissionMode === "PAID" ? settings.basePriceCents : 0;
  const totalCents = basePriceCents + (skipOffer?.priceCents || 0) + (reactOffer?.priceCents || 0);

  const data = {
    hostId: host.id,
    fanId: getSessionFanId(req),
    name: name.trim(),
    email: email ? email.trim() : null,
    songName: songName.trim(),
    message: message ? message.trim() : null,
    link: link.trim(),
    sourceType: isUpload ? "UPLOAD" : "LINK",
    skipOfferId: skipOffer?.id || null,
    reactOfferId: reactOffer?.id || null,
    amountCents: totalCents,
  };

  if (totalCents === 0) {
    // Nothing to charge: drop it straight into the queue if the host has
    // auto-approve on, otherwise hold it for manual review like before.
    const submission = await prisma.submission.create({
      data: { ...data, status: settings.autoApprove ? "QUEUED" : "PENDING", paid: false },
    });
    broadcastQueueUpdate(host.id);
    notifyHostNewSubmission(host, submission);
    return res.status(201).json({ free: true, submission });
  }

  // A host who isn't the platform founder and hasn't finished Stripe Connect
  // onboarding has nowhere for paid money to land — block it rather than
  // silently taking payment the host could never receive.
  if (!host.isFounder && !host.stripeOnboarded) {
    return res.status(400).json({ error: "This channel hasn't set up payments yet." });
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

  // Founder charges land directly on the platform's own Stripe account, same
  // as the original single-tenant setup — no fee, since there's no separate
  // platform to pay. Every other host is a destination charge onto their own
  // connected account, minus the platform's cut.
  const paymentIntentData = host.isFounder
    ? undefined
    : {
        application_fee_amount: Math.round((totalCents * host.platformFeeBps) / 10000),
        transfer_data: { destination: host.stripeAccountId },
      };

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      payment_intent_data: paymentIntentData,
      success_url: `${origin}/h/${host.slug}/submit?paid=1&submission=${submission.id}`,
      cancel_url: `${origin}/h/${host.slug}/submit?canceled=1`,
      metadata: { submissionId: submission.id, hostId: host.id },
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
