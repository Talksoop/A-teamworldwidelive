import Head from "next/head";

export default function Home() {
  return (
    <>
      <Head>
        <title>A-Team Worldwide Live</title>
      </Head>
      <main style={styles.main}>
        <div style={styles.badge} aria-hidden="true">
          <span style={styles.badgeStar}>★</span>
        </div>
        <h1 style={styles.title}>
          <span className="glow-text">A-TEAM</span>
          <span style={styles.titleSub}>WORLD WIDE LIVE</span>
        </h1>
        <p style={styles.sub}>Send a track. It's in the queue. Watch it play live.</p>
        <div style={styles.links}>
          <a href="/submit" style={styles.primaryBtn}>
            Submit a track
          </a>
          <a href="/overlay" style={styles.secondaryLink}>
            View the live queue
          </a>
        </div>
      </main>
    </>
  );
}

const styles = {
  main: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    textAlign: "center",
  },
  badge: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    border: "2px solid var(--cyan)",
    boxShadow: "var(--glow-cyan), inset 0 0 14px rgba(155,107,255,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  badgeStar: {
    color: "var(--cyan)",
    fontSize: "1.6rem",
    filter: "drop-shadow(0 0 6px rgba(79,216,245,0.8))",
  },
  title: {
    fontFamily: "var(--font-head)",
    fontWeight: 800,
    fontSize: "clamp(2.2rem, 9vw, 3.6rem)",
    margin: 0,
    letterSpacing: "0.03em",
    lineHeight: 1.15,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  titleSub: {
    fontSize: "0.32em",
    color: "var(--text-dim)",
    letterSpacing: "0.35em",
    marginTop: 6,
  },
  sub: {
    color: "var(--text-dim)",
    fontSize: "1.05rem",
    marginTop: 20,
    marginBottom: 40,
    maxWidth: 380,
  },
  links: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    alignItems: "center",
  },
  primaryBtn: {
    background: "var(--gradient)",
    color: "#05060e",
    fontWeight: 700,
    padding: "14px 32px",
    borderRadius: 8,
    textDecoration: "none",
    fontSize: "1rem",
    boxShadow: "var(--glow-purple)",
  },
  secondaryLink: {
    color: "var(--text-dim)",
    textDecoration: "underline",
    textUnderlineOffset: 4,
    fontSize: "0.95rem",
  },
};

