import Head from "next/head";
import { useRouter } from "next/router";
import SiteFooter from "../lib/SiteFooter";

const WAYS_TO_EARN = [
  {
    id: "live-reviews",
    badge: "LIVE",
    title: "Live Reviews & Skip Tiers",
    desc:
      "Go live and let fans submit their tracks for real-time reviews. Keep it free or set a base price, then offer skip tiers so fans can pay to jump the queue.",
  },
  {
    id: "battles",
    badge: "BATTLES",
    title: "Song Battles",
    desc: "Pit two submissions head-to-head and let your audience vote live for the winner.",
  },
  {
    id: "ama",
    badge: "AMA",
    title: "Paid AMA & Private Requests",
    desc:
      "One link for fans to ask anything or send a track — written or video, on your own schedule, priced however you want. No livestream required.",
  },
  {
    id: "radio",
    badge: "RADIO",
    title: "Radio Recommendations",
    desc:
      "Spot a standout submission during a live session? Recommend it for radio consideration through our Connect Diva Media partnership.",
  },
  {
    id: "schedule",
    badge: "SCHEDULE",
    title: "Go-Live Schedule",
    desc: "Post your upcoming stream times so fans know exactly when to show up and submit.",
  },
];

const HOW_IT_WORKS = [
  {
    n: "1",
    title: "Create your channel",
    desc: "Free to start. Set your base price, skip tiers, and AMA rate whenever you're ready — or leave it all free.",
  },
  {
    n: "2",
    title: "Fans submit & fund the queue",
    desc: "They drop a link or upload a file, and pay for a skip or a priority AMA if they want to jump the line.",
  },
  {
    n: "3",
    title: "Go live anywhere & get paid",
    desc: "Stream on Twitch, TikTok, YouTube, Instagram — wherever. Payments land straight in your bank via Stripe.",
  },
];

// The whole card is clickable, but it also contains its own "Sign up" /
// "Log in" buttons — nesting an <a> inside an <a> is invalid HTML and was
// causing a hydration mismatch (the browser silently un-nests them during
// server-side parsing, but React's tree still has them nested, so server
// and client markup disagree). This renders the wrapper as a <div> that
// behaves like a link instead, so it stays keyboard/screen-reader
// accessible without nesting anchors.
function ClickCard({ href, style, children }) {
  const router = useRouter();
  return (
    <div
      style={style}
      role="link"
      tabIndex={0}
      onClick={(e) => {
        if (e.target.closest("a")) return;
        router.push(href);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(href);
        }
      }}
    >
      {children}
    </div>
  );
}

export default function Home() {
  return (
    <>
      <Head>
        <title>A-Team Worldwide Live</title>
      </Head>
      <main style={styles.main}>
        <div style={styles.topRow}>
          <a href="/pricing" style={styles.topLink}>
            Pricing
          </a>
        </div>

        <div style={styles.bannerRule}>
          <div style={{ ...styles.ruleLine, background: "linear-gradient(90deg, transparent, var(--cyan))" }} />
          <div style={{ ...styles.ruleLine, background: "linear-gradient(90deg, var(--purple), transparent)" }} />
        </div>
        <h1 className="glow-text" style={styles.title}>
          A-TEAM
        </h1>
        <p style={styles.tag}>WORLD WIDE LIVE</p>
        <p style={styles.sub}>Live song reviews, battles, and private requests — pick how you want in.</p>

        <ClickCard href="/discover" style={styles.card}>
          <div style={styles.cardTop}>
            <h2 style={styles.cardTitle}>I'm a fan</h2>
            <span style={{ ...styles.badge, ...styles.badgeCyan }}>FAN</span>
          </div>
          <p style={styles.cardDesc}>
            Follow creators, submit tracks, vote on battles, and see your history in one place.
          </p>
          <div style={styles.ctaRow}>
            <a href="/fan/signup" style={{ ...styles.cta, ...styles.ctaGrad }}>
              Sign up
            </a>
            <a href="/fan/login" style={{ ...styles.cta, ...styles.ctaOutline }}>
              Log in
            </a>
          </div>
        </ClickCard>

        <ClickCard href="/signup" style={styles.card}>
          <div style={styles.cardTop}>
            <h2 style={styles.cardTitle}>I'm a creator</h2>
            <span style={{ ...styles.badge, ...styles.badgePurple }}>CREATOR</span>
          </div>
          <p style={styles.cardDesc}>
            Run your own live queue, skip tiers, battles, and private requests — free to start.
          </p>
          <div style={styles.ctaRow}>
            <a href="/signup" style={{ ...styles.cta, ...styles.ctaGrad }}>
              Start your channel
            </a>
            <a href="/login" style={{ ...styles.cta, ...styles.ctaOutline }}>
              Log in
            </a>
          </div>
        </ClickCard>

        <section style={styles.section} id="about">
          <p style={styles.eyebrow}>FOR CREATORS</p>
          <h2 style={styles.sectionTitle}>Turn your audience into a business</h2>
          <p style={styles.sectionSub}>
            Go live, accept fan submissions, and get paid for your reviews — music, on your own terms. Set your
            prices, control your queue, and keep the majority of everything you earn.
          </p>
        </section>

        <section style={styles.section}>
          <p style={styles.eyebrow}>MONETIZATION</p>
          <h2 style={styles.sectionTitle}>Ways to earn</h2>
          <div style={styles.earnList}>
            {WAYS_TO_EARN.map((w) => (
              <div key={w.id} id={w.id} style={styles.earnCard}>
                <div style={styles.earnTop}>
                  <span style={styles.earnBadge}>{w.badge}</span>
                  <h3 style={styles.earnTitle}>{w.title}</h3>
                </div>
                <p style={styles.earnDesc}>{w.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={styles.section}>
          <p style={styles.eyebrow}>SIMPLE AS 1-2-3</p>
          <h2 style={styles.sectionTitle}>How it works</h2>
          <div style={styles.stepsList}>
            {HOW_IT_WORKS.map((s) => (
              <div key={s.n} style={styles.stepRow}>
                <span style={styles.stepNum}>{s.n}</span>
                <div>
                  <p style={styles.stepTitle}>{s.title}</p>
                  <p style={styles.stepDesc}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <a href="/pricing" style={styles.pricingBanner}>
          <div>
            <p style={styles.pricingBannerTitle}>Keep 80% of what you earn</p>
            <p style={styles.pricingBannerSub}>No monthly fees — see the full breakdown</p>
          </div>
          <span style={styles.pricingBannerArrow} aria-hidden="true">
            →
          </span>
        </a>
      </main>
      <SiteFooter />
    </>
  );
}

const styles = {
  main: {
    maxWidth: 460,
    margin: "0 auto",
    padding: "20px 20px 0",
    textAlign: "center",
  },
  topRow: {
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: 12,
  },
  topLink: {
    color: "var(--text-dim)",
    fontSize: "0.82rem",
    fontWeight: 600,
    textDecoration: "none",
  },
  bannerRule: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  ruleLine: {
    flex: 1,
    height: 1,
  },
  title: {
    fontFamily: "var(--font-head)",
    fontWeight: 800,
    fontSize: "clamp(2.2rem, 9vw, 3rem)",
    margin: 0,
    letterSpacing: "0.03em",
  },
  tag: {
    fontSize: "0.78rem",
    letterSpacing: "0.2em",
    color: "var(--text-dim)",
    margin: "6px 0 0",
  },
  sub: {
    color: "var(--text-dim)",
    fontSize: "1rem",
    margin: "18px 0 32px",
  },
  card: {
    display: "block",
    background: "var(--panel)",
    border: "1px solid var(--line)",
    borderRadius: "var(--radius-md)",
    boxShadow: "var(--shadow-md)",
    padding: 22,
    marginBottom: 16,
    textAlign: "left",
    textDecoration: "none",
    color: "var(--text)",
    cursor: "pointer",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: "1.15rem",
    fontWeight: 700,
    margin: 0,
  },
  badge: {
    fontSize: "0.66rem",
    fontWeight: 700,
    padding: "5px 11px",
    borderRadius: 100,
    whiteSpace: "nowrap",
  },
  badgeCyan: {
    background: "rgba(79,216,245,0.12)",
    color: "var(--cyan)",
    border: "1px solid rgba(79,216,245,0.35)",
  },
  badgePurple: {
    background: "rgba(155,107,255,0.12)",
    color: "var(--purple)",
    border: "1px solid rgba(155,107,255,0.35)",
  },
  cardDesc: {
    color: "var(--text-dim)",
    fontSize: "0.9rem",
    margin: "0 0 18px",
    lineHeight: 1.4,
  },
  ctaRow: {
    display: "flex",
    gap: 10,
  },
  cta: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px",
    borderRadius: "var(--radius-sm)",
    fontWeight: 700,
    fontSize: "0.85rem",
    textDecoration: "none",
    textAlign: "center",
  },
  ctaGrad: {
    background: "var(--gradient)",
    color: "#05060e",
  },
  ctaOutline: {
    background: "transparent",
    border: "1px solid var(--line)",
    color: "var(--text-dim)",
  },
  section: {
    textAlign: "left",
    marginTop: 44,
    scrollMarginTop: 20,
  },
  eyebrow: {
    fontSize: "0.7rem",
    fontWeight: 700,
    letterSpacing: "0.14em",
    color: "var(--cyan)",
    margin: "0 0 8px",
  },
  sectionTitle: {
    fontFamily: "var(--font-head)",
    fontWeight: 800,
    fontSize: "1.35rem",
    margin: "0 0 10px",
  },
  sectionSub: {
    color: "var(--text-dim)",
    fontSize: "0.92rem",
    lineHeight: 1.55,
    margin: 0,
  },
  earnList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginTop: 16,
  },
  earnCard: {
    background: "var(--panel)",
    border: "1px solid var(--line-soft)",
    borderRadius: "var(--radius-md)",
    padding: "16px 18px",
    scrollMarginTop: 20,
  },
  earnTop: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  earnBadge: {
    fontSize: "0.62rem",
    fontWeight: 700,
    letterSpacing: "0.06em",
    color: "var(--purple)",
    background: "rgba(155,107,255,0.12)",
    border: "1px solid rgba(155,107,255,0.35)",
    borderRadius: 100,
    padding: "3px 9px",
    whiteSpace: "nowrap",
  },
  earnTitle: {
    fontSize: "1rem",
    fontWeight: 700,
    margin: 0,
  },
  earnDesc: {
    color: "var(--text-dim)",
    fontSize: "0.86rem",
    lineHeight: 1.5,
    margin: 0,
  },
  stepsList: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    marginTop: 16,
  },
  stepRow: {
    display: "flex",
    gap: 14,
    alignItems: "flex-start",
  },
  stepNum: {
    flexShrink: 0,
    width: 30,
    height: 30,
    borderRadius: "50%",
    background: "var(--gradient)",
    color: "#05060e",
    fontWeight: 800,
    fontSize: "0.9rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  stepTitle: {
    fontWeight: 700,
    fontSize: "0.95rem",
    margin: "0 0 3px",
  },
  stepDesc: {
    color: "var(--text-dim)",
    fontSize: "0.86rem",
    lineHeight: 1.5,
    margin: 0,
  },
  pricingBanner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 44,
    padding: "18px 20px",
    borderRadius: "var(--radius-md)",
    background: "linear-gradient(135deg, rgba(79,216,245,0.12), rgba(155,107,255,0.12))",
    border: "1px solid var(--line-soft)",
    textDecoration: "none",
    color: "var(--text)",
  },
  pricingBannerTitle: {
    fontWeight: 700,
    fontSize: "0.95rem",
    margin: "0 0 2px",
  },
  pricingBannerSub: {
    color: "var(--text-dim)",
    fontSize: "0.82rem",
    margin: 0,
  },
  pricingBannerArrow: {
    fontSize: "1.3rem",
    color: "var(--cyan)",
  },
};
