import { prisma } from "../../../../lib/prisma";
import { verifyState, exchangeCodeForProfile, clearStateCookie } from "../../../../lib/googleAuth";
import { sessionCookie } from "../../../../lib/auth";
import { fanSessionCookie } from "../../../../lib/fanAuth";
import { ensureLinkedFanCookie, linkedHostCookieIfExists } from "../../../../lib/accountLink";
import { slugify } from "../../../../lib/host";
import { notifyFounderNewHost } from "../../../../lib/notifications";

export default async function handler(req, res) {
  const { code, state, error } = req.query;
  const cookieNonce = req.cookies?.atwl_oauth_state;
  const baseCookies = [clearStateCookie()];

  function redirectWith(location, extraCookies = []) {
    res.setHeader("Set-Cookie", [...baseCookies, ...extraCookies]);
    res.writeHead(302, { Location: location });
    res.end();
  }

  if (error) {
    return redirectWith("/login?error=google_denied");
  }

  const parsed = verifyState(typeof state === "string" ? state : "", cookieNonce);
  if (!parsed || !code) {
    return redirectWith("/login?error=google_state");
  }
  const { role, returnTo } = parsed;
  const failUrl = role === "host" ? "/login" : "/fan/login";

  let profile;
  try {
    profile = await exchangeCodeForProfile(code);
  } catch (err) {
    console.error("Google OAuth exchange failed:", err.message);
    return redirectWith(`${failUrl}?error=google_failed`);
  }

  if (!profile?.email) {
    return redirectWith(`${failUrl}?error=google_no_email`);
  }
  const email = profile.email.toLowerCase();
  const name = (profile.name || email.split("@")[0]).slice(0, 60);

  if (role === "host") {
    let host = await prisma.host.findUnique({ where: { email } });
    if (!host) {
      let baseSlug = slugify(name) || "host";
      let slug = baseSlug;
      let n = 1;
      while (await prisma.host.findUnique({ where: { slug } })) {
        n += 1;
        slug = `${baseSlug}-${n}`;
      }
      host = await prisma.host.create({
        data: { email, name, slug, googleId: profile.sub },
      });
      await prisma.settings.create({ data: { hostId: host.id } });
      notifyFounderNewHost(host);
    } else if (profile.sub && host.googleId !== profile.sub) {
      host = await prisma.host.update({ where: { id: host.id }, data: { googleId: profile.sub } });
    }

    const fanCookie = await ensureLinkedFanCookie(host);
    return redirectWith(returnTo !== "/" ? returnTo : "/admin", [sessionCookie(host.id), fanCookie]);
  }

  // role === "fan"
  let fan = await prisma.fan.findUnique({ where: { email } });
  if (!fan) {
    fan = await prisma.fan.create({ data: { email, name, googleId: profile.sub } });
  } else if (profile.sub && fan.googleId !== profile.sub) {
    fan = await prisma.fan.update({ where: { id: fan.id }, data: { googleId: profile.sub } });
  }

  const hostCookie = await linkedHostCookieIfExists(fan);
  return redirectWith(
    returnTo !== "/" ? returnTo : "/discover",
    hostCookie ? [fanSessionCookie(fan.id), hostCookie] : [fanSessionCookie(fan.id)]
  );
}
