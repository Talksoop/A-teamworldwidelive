import { useEffect, useState } from "react";
import Head from "next/head";
import SiteNav from "../lib/SiteNav";

function formatWhen(e) {
  const start = new Date(e.startsAt);
  const startOpts = { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" };
  if (!e.endsAt) {
    return start.toLocaleString(undefined, startOpts);
  }
  const end = new Date(e.endsAt);
  const sameDay = start.toDateString() === end.toDateString();
  const endStr = end.toLocaleString(undefined, sameDay ? { hour: "numeric", minute: "2-digit" } : startOpts);
  return `${start.toLocaleString(undefined, startOpts)} – ${endStr}`;
}

export default function Discover() {
  const [hosts, setHosts] = useState([]);
  const [fan, setFan] = useState(null);
  const [following, setFollowing] = useState(new Set());
  const [upcoming, setUpcoming] = useState([]);

  useEffect(() => {
    fetch("/api/hosts")
      .then((r) => r.json())
      .then(setHosts);
    fetch("/api/fan/me")
      .then((r) => (r.ok ? r.json() : null))
      .then(setFan);
    fetch("/api/schedule/upcoming")
      .then((r) => (r.ok ? r.json() : []))
      .then(setUpcoming);
  }, []);

  useEffect(() => {
    if (!fan) return;
    fetch("/api/fan/following")
      .then((r) => r.json())
      .then((list) => setFollowing(new Set(list.map((h) => h.id))));
  }, [fan]);

  async function toggleFollow(hostId) {
    if (!fan) {
      window.location.href = "/fan/login";
      return;
    }
    const isFollowing = following.has(hostId);
    const method = isFollowing ? "DELETE" : "POST";
    const res = await fetch("/api/fan/follow", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hostId }),
    });
    if (!res.ok) return;
    setFollowing((prev) => {
      const next = new Set(prev);
      if (isFollowing) next.delete(hostId);
      else next.add(hostId);
      return next;
    });
  }

  return (
    <>
      <Head>
        <title>Discover creators — A-Team Worldwide Live</title>
      </Head>
      <SiteNav />
      <main style={styles.main}>
        <h1 style={styles.title}>Discover creators</h1>
        <p style={styles.sub}>Follow the ones you want to keep up with.</p>

        {upcoming.length > 0 && (
          <div style={styles.calendarBox}>
            <p style={styles.calendarLabel}>Going live soon</p>
            {upcoming.slice(0, 8).map((e) => (
              <a key={e.id} href={`/h/${e.host.slug}`} style={styles.calendarRow}>
                <div>
                  <div style={styles.calendarTitle}>{e.title}</div>
                  <div style={styles.calendarHost}>
                    {e.host.name}
                    {e.platform && ` · ${e.platform}`}
                  </div>
                </div>
                <span style={styles.calendarWhen}>{formatWhen(e)}</span>
              </a>
            ))}
          </div>
        )}

        {hosts.length === 0 ? (
          <p style={styles.empty}>No creators yet.</p>
        ) : (
          hosts.map((h) => (
            <div key={h.id} style={styles.row}>
              <a href={`/h/${h.slug}`} style={styles.rowLink}>
                <div style={styles.rowName}>{h.name}</div>
                <div style={styles.rowSlug}>/h/{h.slug}</div>
              </a>
              <button
                style={following.has(h.id) ? styles.followingBtn : styles.followBtn}
                onClick={() => toggleFollow(h.id)}
              >
                {following.has(h.id) ? "Following" : "Follow"}
              </button>
            </div>
          ))
        )}
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
    margin: "0 0 6px",
  },
  sub: {
    color: "var(--text-dim)",
    fontSize: "0.9rem",
    margin: "0 0 24px",
  },
  empty: {
    color: "var(--text-dim)",
    fontSize: "0.9rem",
  },
  calendarBox: {
    background: "var(--panel)",
    border: "1px solid var(--line-soft)",
    borderRadius: "var(--radius-md)",
    padding: "14px 16px",
    marginBottom: 20,
  },
  calendarLabel: {
    fontSize: "0.7rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    color: "var(--cyan)",
    margin: "0 0 8px",
    textTransform: "uppercase",
  },
  calendarRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    padding: "8px 0",
    textDecoration: "none",
    color: "var(--text)",
    borderTop: "1px solid var(--line-soft)",
  },
  calendarTitle: {
    fontWeight: 600,
    fontSize: "0.9rem",
  },
  calendarHost: {
    fontSize: "0.78rem",
    color: "var(--text-dim)",
    marginTop: 2,
  },
  calendarWhen: {
    fontSize: "0.8rem",
    color: "var(--text-dim)",
    whiteSpace: "nowrap",
  },
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    background: "var(--panel)",
    border: "1px solid var(--line-soft)",
    borderRadius: "var(--radius-md)",
    boxShadow: "var(--shadow-sm)",
    padding: "14px 16px",
    marginBottom: 10,
  },
  rowLink: {
    textDecoration: "none",
    color: "var(--text)",
  },
  rowName: {
    fontWeight: 700,
    fontSize: "0.98rem",
  },
  rowSlug: {
    color: "var(--text-dim)",
    fontSize: "0.78rem",
    marginTop: 2,
  },
  followBtn: {
    background: "var(--gradient)",
    color: "#05060e",
    border: "none",
    fontWeight: 700,
    padding: "8px 16px",
    borderRadius: "var(--radius-sm)",
    fontSize: "0.82rem",
    whiteSpace: "nowrap",
  },
  followingBtn: {
    background: "transparent",
    border: "1px solid var(--line)",
    color: "var(--text-dim)",
    fontWeight: 600,
    padding: "8px 16px",
    borderRadius: "var(--radius-sm)",
    fontSize: "0.82rem",
    whiteSpace: "nowrap",
  },
};
