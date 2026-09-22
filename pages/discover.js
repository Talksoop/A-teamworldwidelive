import { useEffect, useState } from "react";
import Head from "next/head";
import SiteNav from "../lib/SiteNav";

export default function Discover() {
  const [hosts, setHosts] = useState([]);
  const [fan, setFan] = useState(null);
  const [following, setFollowing] = useState(new Set());

  useEffect(() => {
    fetch("/api/hosts")
      .then((r) => r.json())
      .then(setHosts);
    fetch("/api/fan/me")
      .then((r) => (r.ok ? r.json() : null))
      .then(setFan);
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
