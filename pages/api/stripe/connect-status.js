import { prisma } from "../../../lib/prisma";
import { getStripe } from "../../../lib/stripe";
import { getSessionHostId } from "../../../lib/auth";

export default async function handler(req, res) {
  const hostId = getSessionHostId(req);
  if (!hostId) {
    return res.status(401).json({ error: "Not authorized." });
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end();
  }

  const host = await prisma.host.findUnique({ where: { id: hostId } });
  if (!host || !host.stripeAccountId) {
    return res.status(200).json({ stripeOnboarded: false });
  }

  const stripe = getStripe();
  const account = await stripe.accounts.retrieve(host.stripeAccountId);
  const onboarded = Boolean(account.charges_enabled);

  if (onboarded !== host.stripeOnboarded) {
    await prisma.host.update({ where: { id: hostId }, data: { stripeOnboarded: onboarded } });
  }

  return res.status(200).json({ stripeOnboarded: onboarded });
}
