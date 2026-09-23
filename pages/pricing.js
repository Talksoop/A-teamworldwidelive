import Head from "next/head";
import SiteFooter from "../lib/SiteFooter";

function Row({ title, children }) {
  return (
    <div style={styles.row}>
      <h3 style={styles.rowTitle}>{title}</h3>
      <p style={styles.rowDesc}>{children}</p>
    </div>
  );
}

export default function Pricing() {
  return (
    <>
      <Head>
        <title>Pricing — A-Team Worldwide Live</title>
      </Head>
      <main style={styles.main}>
        <a href="/" style={styles.back}>
          ← A-Team Worldwide Live
        </a>
        <h1 style={styles.title}>Simple, pay-as-you-earn pricing</h1>
        <p style={styles.sub}>No monthly fees. No listing fees. We only make money when you do.</p>

        <section style={styles.section}>
          <p style={styles.eyebrow}>FOR CREATORS</p>
          <div style={styles.card}>
            <Row title="Creating a channel is free">
              Sign up, set up your queue, and start accepting submissions at no cost — no subscription, no setup
              fee.
            </Row>
            <Row title="You set every price">
              Base entry price (or keep it free), skip tiers, react add-ons, and your AMA rate are all yours to
              set and change anytime from your dashboard.
            </Row>
            <Row title="Platform fee: 20% on paid transactions">
              You keep 80% of every paid submission, skip, react, or AMA. There's no fee at all on free
              submissions.
            </Row>
            <Row title="Paid straight to your bank">
              Payments run through Stripe and are deposited directly to your connected bank account — we never
              hold your money.
            </Row>
          </div>
        </section>

        <section style={styles.section}>
          <p style={styles.eyebrow}>FLEXIBLE CONTROLS</p>
          <div style={styles.card}>
            <Row title="Free-submission quota">
              Give your first few submissions each session free, then switch to your paid price automatically —
              a nice way to warm up a queue before charging.
            </Row>
            <Row title="Manual or automatic approval">
              Review every free submission before it hits the queue, or let them drop straight in — your call,
              and it's a toggle you can flip anytime.
            </Row>
            <Row title="Open and close your queue on demand">
              Stop taking new submissions whenever you want without touching your prices or losing your queue.
            </Row>
          </div>
        </section>

        <section style={styles.section}>
          <p style={styles.eyebrow}>FOR FANS</p>
          <div style={styles.card}>
            <Row title="Browsing, following, and free submissions cost nothing">
              Discover creators, follow your favorites, and submit to any channel that's set to free — no
              account fee, ever.
            </Row>
            <Row title="You only pay for what you choose">
              A skip tier to jump the queue, a priority spot in an AMA inbox, or a base entry price a creator has
              set — you always see the price before you pay.
            </Row>
          </div>
        </section>

        <div style={styles.ctaRow}>
          <a href="/signup" style={{ ...styles.cta, ...styles.ctaGrad }}>
            Start your channel
          </a>
          <a href="/discover" style={{ ...styles.cta, ...styles.ctaOutline }}>
            Browse creators
          </a>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

const styles = {
  main: {
    maxWidth: 460,
    margin: "0 auto",
    padding: "32px 20px 20px",
  },
  back: {
    display: "inline-block",
    color: "var(--text-dim)",
    fontSize: "0.82rem",
    fontWeight: 600,
    textDecoration: "none",
    marginBottom: 22,
  },
  title: {
    fontFamily: "var(--font-head)",
    fontWeight: 800,
    fontSize: "1.7rem",
    margin: "0 0 8px",
    lineHeight: 1.2,
  },
  sub: {
    color: "var(--text-dim)",
    fontSize: "0.92rem",
    margin: "0 0 30px",
    lineHeight: 1.5,
  },
  section: {
    marginBottom: 26,
  },
  eyebrow: {
    fontSize: "0.7rem",
    fontWeight: 700,
    letterSpacing: "0.14em",
    color: "var(--cyan)",
    margin: "0 0 10px",
  },
  card: {
    background: "var(--panel)",
    border: "1px solid var(--line-soft)",
    borderRadius: "var(--radius-md)",
    boxShadow: "var(--shadow-sm)",
    padding: "18px 20px 4px",
  },
  row: {
    marginBottom: 18,
  },
  rowTitle: {
    fontSize: "0.95rem",
    fontWeight: 700,
    margin: "0 0 5px",
  },
  rowDesc: {
    color: "var(--text-dim)",
    fontSize: "0.87rem",
    lineHeight: 1.55,
    margin: 0,
  },
  ctaRow: {
    display: "flex",
    gap: 10,
    marginTop: 8,
    marginBottom: 8,
  },
  cta: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "13px",
    borderRadius: "var(--radius-sm)",
    fontWeight: 700,
    fontSize: "0.88rem",
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
};
