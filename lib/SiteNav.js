import { useEffect, useState } from "react";

export default function SiteNav({ slug }) {
  const [fan, setFan] = useState(null);
  const [host, setHost] = useState(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/fan/me").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/me").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([fanData, hostData]) => {
        setFan(fanData);
        setHost(hostData);
      })
      .finally(() => setChecked(true));
  }, []);

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        <a href="/" style={styles.logo}>
          A-TEAM
        </a>
        <div style={styles.links}>
          {slug && (
            <>
              <a href={`/h/${slug}`} style={styles.link}>
                Home
              </a>
              <a href={`/h/${slug}/submit`} style={styles.link}>
                Submit
              </a>
              <a href={`/h/${slug}/queue`} style={styles.link}>
                Queue
              </a>
              <a href={`/h/${slug}/vote`} style={styles.link}>
                Vote
              </a>
              <a href={`/h/${slug}/ama`} style={styles.link}>
                AMA
              </a>
              <span style={styles.divider} />
            </>
          )}
          <a href="/discover" style={styles.link}>
            Discover
          </a>
          {checked && host && (
            <a href="/admin" style={styles.switchBtn}>
              Switch to Creator mode
            </a>
          )}
          {checked &&
            (fan ? (
              <a href="/fan/account" style={styles.linkAccent}>
                {fan.name}
              </a>
            ) : (
              <a href="/fan/login" style={styles.link}>
                Log in
              </a>
            ))}
        </div>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    borderBottom: "1px solid var(--line)",
    background: "rgba(8,9,15,0.85)",
    backdropFilter: "blur(6px)",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  inner: {
    maxWidth: 640,
    margin: "0 auto",
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    overflowX: "auto",
    WebkitOverflowScrolling: "touch",
  },
  logo: {
    fontFamily: "var(--font-head)",
    fontWeight: 800,
    fontSize: "0.85rem",
    letterSpacing: "0.04em",
    color: "var(--cyan)",
    textDecoration: "none",
    flexShrink: 0,
  },
  links: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    overflowX: "auto",
  },
  link: {
    color: "var(--text-dim)",
    fontSize: "0.82rem",
    fontWeight: 600,
    textDecoration: "none",
    whiteSpace: "nowrap",
  },
  linkAccent: {
    color: "var(--cyan)",
    fontSize: "0.82rem",
    fontWeight: 700,
    textDecoration: "none",
    whiteSpace: "nowrap",
  },
  divider: {
    width: 1,
    height: 16,
    background: "var(--line)",
    flexShrink: 0,
  },
  switchBtn: {
    background: "transparent",
    border: "1px solid var(--purple)",
    color: "var(--purple)",
    fontWeight: 700,
    fontSize: "0.78rem",
    padding: "5px 10px",
    borderRadius: "var(--radius-sm)",
    textDecoration: "none",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
};
