import { useEffect, useState } from "react";
import Head from "next/head";
import SiteNav from "../../lib/SiteNav";

function formatPrice(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function FanAccount() {
  const [fan, setFan] = useState(null);
  const [checked, setChecked] = useState(false);
  const [following, setFollowing] = useState([]);
  const [history, setHistory] = useState(null);

  useEffect(() => {
    fetch("/api/fan/me")
      .then((r) => (r.ok ? r.json() : null))
      .then(setFan)
      .finally(() => setChecked(true));
  }, []);

  useEffect(() => {
    if (!fan) return;
    fetch("/api/fan/following")
      .then((r) => r.json())
      .then(setFollowing);
    fetch("/api/fan/history")
      .then((r) => r.json())
      .then(setHistory);
  }, [fan]);

  async function logout() {
    await fetch("/api/fan/logout", { method: "POST" });
    window.location.href = "/";
  }

  if (checked && !fan) {
    return (
      <>
        <SiteNav />
        <main style={styles.main}>
          <p style={styles.empty}>
            <a href="/fan/login" style={styles.link}>
              Log in
            </a>{" "}
            to see your account.
          </p>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>My account — A-Team Worldwide Live</title>
      </Head>
      <SiteNav />
      <main style={styles.main}>
        <h1 style={styles.title}>{fan?.name}</h1>
        <p style={styles.sub}>{fan?.email}</p>

        <section style={styles.section}>
          <p style={styles.sectionLabel}>FOLLOWING ({following.length})</p>
          {following.length === 0 ? (
            <p style={styles.empty}>
              Not following anyone yet.{" "}
              <a href="/discover" style={styles.link}>
                Discover creators
              </a>
            </p>
          ) : (
            following.map((h) => (
              <a key={h.id} href={`/h/${h.slug}`} style={styles.followRow}>
                {h.name}
              </a>
            ))
          )}
        </section>

        <section style={styles.section}>
          <p style={styles.sectionLabel}>YOUR SUBMISSIONS ({history?.submissions.length || 0})</p>
          {!history || history.submissions.length === 0 ? (
            <p style={styles.empty}>No submissions yet.</p>
          ) : (
            history.submissions.map((s) => (
              <div key={s.id} style={styles.histRow}>
                <div>
                  <div style={styles.histTitle}>{s.songName || "(untitled)"}</div>
                  <div style={styles.histSub}>
                    to {s.host?.name || "a creator"} · {s.status}
                  </div>
                </div>
                {s.paid && <div style={styles.histPrice}>{formatPrice(s.amountCents)}</div>}
              </div>
            ))
          )}
        </section>

        <section style={styles.section}>
          <p style={styles.sectionLabel}>YOUR REQUESTS ({history?.amaRequests.length || 0})</p>
          {!history || history.amaRequests.length === 0 ? (
            <p style={styles.empty}>No private requests yet.</p>
          ) : (
            history.amaRequests.map((a) => (
              <div key={a.id} style={styles.histRow}>
                <div>
                  <div style={styles.histTitle}>{a.question}</div>
                  <div style={styles.histSub}>
                    to {a.host?.name || "a creator"} · {a.status}
                  </div>
                </div>
              </div>
            ))
          )}
        </section>

        <button style={styles.logoutBtn} onClick={logout}>
          Log out
        </button>
      </main>
    </>
  );
}

const styles = {
  main: {
    maxWidth: 460,
    margin: "0 auto",
    padding: "24px 16px 60px",
  },
  title: {
    fontFamily: "var(--font-head)",
    fontWeight: 800,
    fontSize: "1.5rem",
    margin: 0,
  },
  sub: {
    color: "var(--text-dim)",
    fontSize: "0.85rem",
    margin: "4px 0 28px",
  },
  section: {
    marginBottom: 30,
  },
  sectionLabel: {
    fontSize: "0.75rem",
    color: "var(--text-dim)",
    letterSpacing: "0.06em",
    margin: "0 0 10px 2px",
  },
  empty: {
    color: "var(--text-dim)",
    fontSize: "0.9rem",
  },
  link: {
    color: "var(--cyan)",
    textDecoration: "underline",
  },
  followRow: {
    display: "block",
    background: "var(--panel)",
    border: "1px solid var(--line-soft)",
    borderRadius: "var(--radius-sm)",
    padding: "11px 14px",
    marginBottom: 8,
    color: "var(--text)",
    textDecoration: "none",
    fontWeight: 600,
    fontSize: "0.9rem",
  },
  histRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    padding: "11px 4px",
    borderBottom: "1px solid var(--line)",
  },
  histTitle: {
    fontWeight: 600,
    fontSize: "0.9rem",
  },
  histSub: {
    color: "var(--text-dim)",
    fontSize: "0.76rem",
    marginTop: 2,
  },
  histPrice: {
    color: "var(--cyan)",
    fontWeight: 700,
    fontSize: "0.85rem",
    whiteSpace: "nowrap",
  },
  logoutBtn: {
    background: "transparent",
    border: "1px solid var(--line)",
    color: "var(--text-dim)",
    fontWeight: 600,
    padding: "11px 20px",
    borderRadius: "var(--radius-sm)",
    fontSize: "0.85rem",
  },
};
