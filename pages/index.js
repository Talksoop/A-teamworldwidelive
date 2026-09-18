import Head from "next/head";

export default function Home() {
  return (
    <>
      <Head>
        <title>Soop on the Track — Aux Cord</title>
      </Head>
      <main style={styles.main}>
        <div style={styles.reel} aria-hidden="true" />
        <h1 style={styles.title}>Aux Cord</h1>
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
  reel: {
    width: 56,
    height: 56,
    borderRadius: "50%",
    border: "3px solid var(--accent)",
    borderTopColor: "transparent",
    marginBottom: 28,
  },
  title: {
    fontFamily: "var(--font-head)",
    fontWeight: 700,
    fontSize: "clamp(2.5rem, 8vw, 4rem)",
    margin: 0,
    letterSpacing: "-0.02em",
  },
  sub: {
    color: "var(--text-dim)",
    fontSize: "1.05rem",
    marginTop: 12,
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
    background: "var(--accent)",
    color: "#15120e",
    fontWeight: 600,
    padding: "14px 32px",
    borderRadius: 8,
    textDecoration: "none",
    fontSize: "1rem",
  },
  secondaryLink: {
    color: "var(--text-dim)",
    textDecoration: "underline",
    textUnderlineOffset: 4,
    fontSize: "0.95rem",
  },
};
