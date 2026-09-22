import { prisma } from "./prisma";
import { sessionCookie } from "./auth";
import { fanSessionCookie } from "./fanAuth";

// Creator and fan accounts are separate tables with separate session
// cookies, so logging into one has never implied the other — a real person
// who is both (e.g. a creator who also follows other creators) had to sign
// in twice. These helpers link them by email so one login covers both.

// Call after a successful Host login. Ensures a Fan account exists with the
// same email — auto-creating one, reusing the host's password hash, if it
// doesn't — and returns the fan session cookie to set alongside the host's.
// Safe to auto-create in this direction: a Fan account has no public page.
export async function ensureLinkedFanCookie(host) {
  let fan = await prisma.fan.findUnique({ where: { email: host.email } });
  if (!fan) {
    fan = await prisma.fan.create({
      data: {
        email: host.email,
        passwordHash: host.passwordHash,
        name: host.name,
      },
    });
  }
  return fanSessionCookie(fan.id);
}

// Call after a successful Fan login. If a Host account already exists with
// the same email, also logs them into the creator side — no separate
// password check needed, since they've already proven this email+password
// pair via the Fan login. Deliberately does NOT auto-create a Host: that
// would silently spin up a public creator channel (with its own URL slug,
// listed on Discover) for someone who only meant to sign in as a fan.
export async function linkedHostCookieIfExists(fan) {
  const host = await prisma.host.findUnique({ where: { email: fan.email } });
  if (!host) return null;
  return sessionCookie(host.id);
}
