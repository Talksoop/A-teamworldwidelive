const CONTACT_EMAIL = "sooponthetrack@gmail.com";

export default function SiteFooter() {
  return (
    <footer style={styles.footer}>
      <div style={styles.inner}>
        <div style={styles.brandCol}>
          <p style={styles.brand}>A-TEAM WORLDWIDE LIVE</p>
          <p style={styles.tagline}>Live song reviews, battles, and private requests — pick how you want in.</p>
        </div>

        <div style={styles.cols}>
          <div style={styles.col}>
            <p style={styles.colTitle}>Product</p>
            <a style={styles.link} href="/#live-reviews">
              Live Reviews
            </a>
            <a style={styles.link} href="/#battles">
              Song Battles
            </a>
            <a style={styles.link} href="/#ama">
              Paid AMA
            </a>
            <a style={styles.link} href="/pricing">
              Pricing
            </a>
          </div>

          <div style={styles.col}>
            <p style={styles.colTitle}>Company</p>
            <a style={styles.link} href="/">
              About
            </a>
            <a style={styles.link} href={`mailto:${CONTACT_EMAIL}`}>
              Contact
            </a>
          </div>

          <div style={styles.col}>
            <p style={styles.colTitle}>Legal</p>
            <a style={styles.link} href="/privacy">
              Privacy
            </a>
            <a style={styles.link} href="/terms">
              Terms
            </a>
          </div>
        </div>

        <p style={styles.copyright}>© {new Date().getFullYear()} A-Team Worldwide Live. All rights reserved.</p>
      </div>
    </footer>
  );
}

const styles = {
  footer: {
    borderTop: "1px solid var(--line)",
    marginTop: 48,
  },
  inner: {
    maxWidth: 460,
    margin: "0 auto",
    padding: "32px 20px 40px",
  },
  brandCol: {
    marginBottom: 28,
  },
  brand: {
    fontFamily: "var(--font-head)",
    fontWeight: 800,
    fontSize: "0.95rem",
    letterSpacing: "0.04em",
    color: "var(--cyan)",
    margin: "0 0 6px",
  },
  tagline: {
    color: "var(--text-dim)",
    fontSize: "0.85rem",
    lineHeight: 1.5,
    margin: 0,
    maxWidth: 320,
  },
  cols: {
    display: "flex",
    flexWrap: "wrap",
    gap: 28,
    marginBottom: 28,
  },
  col: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    minWidth: 110,
  },
  colTitle: {
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "var(--text)",
    margin: "0 0 2px",
  },
  link: {
    color: "var(--text-dim)",
    fontSize: "0.85rem",
    textDecoration: "none",
  },
  copyright: {
    color: "var(--text-dim)",
    fontSize: "0.76rem",
    margin: 0,
    paddingTop: 20,
    borderTop: "1px solid var(--line-soft)",
  },
};
