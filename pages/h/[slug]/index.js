import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import SiteNav from "../../../lib/SiteNav";
import { useQueueSocket } from "../../../lib/useQueueSocket";

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

export default function HostHome() {
  const router = useRouter();
  const { slug } = router.query;
  const [host, setHost] = useState(null);
  const [fan, setFan] = useState(null);
  const [following, setFollowing] = useState(false);
  const [upcoming, setUpcoming] = useState([]);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/host-info?slug=${slug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setHost);
    fetch(`/api/schedule/upcoming?slug=${slug}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setUpcoming);
  }, [slug]);

  const loadSettings = useCallback(() => {
    if (!slug) return;
    fetch(`/api/settings?slug=${slug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setSettings);
  }, [slug]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Reflect the creator opening/closing submissions right away for anyone
  // sitting on this page.
  useQueueSocket(host?.id, loadSettings, "settings-updated");

  useEffect(() => {
    fetch("/api/fan/me")
      .then((r) => (r.ok ? r.json() : null))
      .then(setFan);
  }, []);

  useEffect(() => {
    if (!fan || !host) return;
    fetch("/api/fan/following")
      .then((r) => r.json())
      .then((list) => setFollowing(list.some((h) => h.id === host.id)));
  }, [fan, host]);

  async function toggleFollow() {
    if (!fan) {
      window.location.href = "/fan/login";
      return;
    }
    const method = following ? "DELETE" : "POST";
    const res = await fetch("/api/fan/follow", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hostId: host.id }),
    });
    if (res.ok) setFollowing(!following);
  }

  return (
    <>
      <Head>
        <title>{host ? host.name : "Live Queue"}</title>
      </Head>
      <SiteNav slug={slug} />
      <main style={styles.main}>
        <div style={styles.banner}>
          <div style={styles.bannerRule}>
            <div style={{ ...styles.ruleLine, background: "linear-gradient(90deg, transparent, var(--cyan))" }} />
            <div style={{ ...styles.ruleLine, background: "linear-gradient(90deg, var(--purple), transparent)" }} />
          </div>
          <div className="glow-text" style={styles.bannerWord}>
            {host ? host.name.toUpperCase() : "LIVE QUEUE"}
          </div>
          <p style={styles.bannerTag}>SUBMIT · WATCH · VOTE</p>
        </div>

        <div style={styles.handleRow}>
          <div>
            <h1 style={styles.handleH1}>Submit to</h1>
            <h1 style={{ ...styles.handleH1, color: "var(--cyan)" }}>@{slug}</h1>
          </div>
          {host && (
            <button
              style={following ? styles.followingBtn : styles.followBtn}
              onClick={toggleFollow}
            >
              {following ? "Following" : "Follow"}
            </button>
          )}
        </div>

        {upcoming.length > 0 && (
          <div style={styles.upcomingBox}>
            <p style={styles.upcomingLabel}>Going live soon</p>
            {upcoming.slice(0, 3).map((e) => (
              <div key={e.id} style={styles.upcomingRow}>
                <span style={styles.upcomingTitle}>
                  {e.title}
                  {e.platform && ` · ${e.platform}`}
                </span>
                <span style={styles.upcomingWhen}>{formatWhen(e)}</span>
              </div>
            ))}
          </div>
        )}

        <a href={`/h/${slug}/submit`} style={styles.card}>
          <div style={styles.cardTop}>
            <h2 style={styles.cardTitle}>Live queue submission</h2>
            <span
              style={{
                ...styles.badge,
                ...(settings?.queueOpen === false ? styles.badgeClosed : styles.badgeQueue),
              }}
            >
              {settings?.queueOpen === false ? "CLOSED" : "QUEUE"}
            </span>
          </div>
          <p style={styles.cardDesc}>
            {settings?.queueOpen === false
              ? "Not taking new submissions right now — check back soon."
              : "Send your track into the live queue. Get reviewed on stream, in front of everyone."}
          </p>
          <div style={styles.chips}>
            <span style={styles.chip}>Public review</span>
            <span style={styles.chip}>Real-time</span>
            <span style={styles.chip}>Skip tiers available</span>
          </div>
          <div
            style={{
              ...styles.cta,
              ...(settings?.queueOpen === false ? styles.ctaOutline : styles.ctaGrad),
            }}
          >
            {settings?.queueOpen === false ? "Submissions closed" : "Submit to queue"}
          </div>
        </a>

        <a href={`/h/${slug}/ama`} style={styles.card}>
          <div style={styles.cardTop}>
            <h2 style={styles.cardTitle}>Private request</h2>
            <span style={{ ...styles.badge, ...styles.badgePrivate }}>PRIVATE</span>
          </div>
          <p style={styles.cardDesc}>
            Get a personal reply — written or a recorded reaction — not on stream.
          </p>
          <div style={styles.chips}>
            <span style={styles.chip}>1-on-1</span>
            <span style={styles.chip}>Written or video reply</span>
            <span style={styles.chip}>Private link</span>
          </div>
          <div style={{ ...styles.cta, ...styles.ctaOutline }}>Send a request</div>
        </a>

        <a href={`/h/${slug}/queue`} style={styles.secondaryLink}>
          View the live queue
        </a>
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
  banner: {
    background: "linear-gradient(160deg, var(--panel-raised), var(--bg))",
    border: "1px solid var(--line)",
    borderRadius: "var(--radius-lg)",
    padding: "34px 20px",
    textAlign: "center",
    marginBottom: 24,
  },
  bannerRule: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  ruleLine: {
    flex: 1,
    height: 1,
  },
  bannerWord: {
    fontFamily: "var(--font-head)",
    fontWeight: 800,
    fontSize: "2rem",
    letterSpacing: "0.03em",
    margin: "6px 0",
  },
  bannerTag: {
    fontSize: "0.75rem",
    letterSpacing: "0.18em",
    color: "var(--text-dim)",
    margin: 0,
  },
  handleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    margin: "22px 4px 16px",
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
  handleH1: {
    fontFamily: "var(--font-head)",
    fontWeight: 700,
    fontSize: "1.3rem",
    margin: 0,
  },
  upcomingBox: {
    background: "var(--panel)",
    border: "1px solid var(--line-soft)",
    borderRadius: "var(--radius-md)",
    padding: "14px 16px",
    marginBottom: 14,
  },
  upcomingLabel: {
    fontSize: "0.7rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    color: "var(--cyan)",
    margin: "0 0 8px",
    textTransform: "uppercase",
  },
  upcomingRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    fontSize: "0.85rem",
    padding: "6px 0",
  },
  upcomingTitle: {
    fontWeight: 600,
  },
  upcomingWhen: {
    color: "var(--text-dim)",
    whiteSpace: "nowrap",
  },
  card: {
    display: "block",
    background: "var(--panel)",
    border: "1px solid var(--line)",
    borderRadius: "var(--radius-md)",
    boxShadow: "var(--shadow-md)",
    padding: 20,
    marginBottom: 14,
    textDecoration: "none",
    color: "var(--text)",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: "1.05rem",
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
  badgeQueue: {
    background: "rgba(79,216,245,0.12)",
    color: "var(--cyan)",
    border: "1px solid rgba(79,216,245,0.35)",
  },
  badgePrivate: {
    background: "rgba(155,107,255,0.12)",
    color: "var(--purple)",
    border: "1px solid rgba(155,107,255,0.35)",
  },
  badgeClosed: {
    background: "rgba(255,255,255,0.06)",
    color: "var(--text-dim)",
    border: "1px solid var(--line)",
  },
  cardDesc: {
    color: "var(--text-dim)",
    fontSize: "0.9rem",
    margin: "0 0 14px",
    lineHeight: 1.4,
  },
  chips: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 16,
  },
  chip: {
    background: "var(--panel-raised)",
    border: "1px solid var(--line)",
    color: "var(--text-dim)",
    fontSize: "0.7rem",
    padding: "5px 10px",
    borderRadius: 100,
  },
  cta: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 13,
    borderRadius: "var(--radius-sm)",
    fontWeight: 700,
    fontSize: "0.9rem",
    textAlign: "center",
  },
  ctaGrad: {
    background: "var(--gradient)",
    color: "#05060e",
    boxShadow: "0 4px 16px rgba(155,107,255,0.3)",
  },
  ctaOutline: {
    background: "transparent",
    border: "1px solid var(--purple)",
    color: "var(--purple)",
  },
  secondaryLink: {
    display: "block",
    textAlign: "center",
    color: "var(--text-dim)",
    textDecoration: "underline",
    textUnderlineOffset: 4,
    fontSize: "0.9rem",
    marginTop: 8,
  },
};
