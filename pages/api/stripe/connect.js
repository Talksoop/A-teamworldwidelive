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
  if (!host) {
    return res.status(404).json({ error: "Not found." });
  }

  const stripe = getStripe();
  let accountId = host.stripeAccountId;

  if (!accountId) {
    let account;
    try {
      account = await stripe.accounts.create({
        type: "express",
        email: host.email,
        business_type: "individual",
      });
    } catch (err) {
      if (err.message?.includes("signed up for Connect")) {
        return res.status(500).json({
          error:
            "Connect isn't enabled on this platform's Stripe account yet. The platform owner needs to enable it once at https://dashboard.stripe.com/connect/accounts/overview",
        });
      }
      throw err;
    }
    accountId = account.id;
    await prisma.host.update({ where: { id: hostId }, data: { stripeAccountId: accountId } });
  }

  const origin = req.headers.origin || `https://${req.headers.host}`;
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${origin}/admin?tab=channel`,
    return_url: `${origin}/admin?tab=channel&stripe_return=1`,
    type: "account_onboarding",
  });

  return res.status(200).json({ url: link.url });
}
