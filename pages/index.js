import Head from "next/head";

export default function Home() {
  return (
    <>
      <Head>
        <title>A-Team Worldwide Live</title>
      </Head>
      <main style={styles.main}>
        <div style={styles.bannerRule}>
          <div style={{ ...styles.ruleLine, background: "linear-gradient(90deg, transparent, var(--cyan))" }} />
          <div style={{ ...styles.ruleLine, background: "linear-gradient(90deg, var(--purple), transparent)" }} />
        </div>
        <h1 className="glow-text" style={styles.title}>
          A-TEAM
        </h1>
        <p style={styles.tag}>WORLD WIDE LIVE</p>
        <p style={styles.sub}>Live song reviews, battles, and private requests — pick how you want in.</p>

        <a href="/discover" style={styles.card}>
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
        </a>

        <a href="/signup" style={styles.card}>
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
        </a>
      </main>
    </>
  );
}

const styles = {
  main: {
    maxWidth: 460,
    margin: "0 auto",
    padding: "40px 20px 60px",
    textAlign: "center",
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
};
