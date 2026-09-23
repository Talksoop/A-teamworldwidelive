import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import SiteNav from "../../../lib/SiteNav";
import { useQueueSocket } from "../../../lib/useQueueSocket";

export default function QueueView() {
  const router = useRouter();
  const { slug } = router.query;
  const [data, setData] = useState({ playing: null, queue: [] });
  const [hostId, setHostId] = useState(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    if (!slug) return;
    try {
      const res = await fetch(`/api/current?slug=${slug}`);
      const json = await res.json();
      setData(json);
      if (json.hostId) setHostId(json.hostId);
    } catch {
      // keep last known state
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  useQueueSocket(hostId, load);

  const filteredQueue = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data.queue;
    return data.queue.filter(
      (item) =>
        (item.songName || "").toLowerCase().includes(q) || item.name.toLowerCase().includes(q)
    );
  }, [data.queue, search]);

  return (
    <>
      <Head>
        <title>Queue — {slug}</title>
      </Head>
      <SiteNav slug={slug} />
      <main style={styles.main}>
        <div style={styles.headerRow}>
          <h1 style={styles.title}>Queue</h1>
          <a href={`/h/${slug}/submit`} style={styles.submitLink}>
            + Submit
          </a>
        </div>

        <input
          style={styles.search}
          placeholder="Search by song, artist, or user..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div style={styles.nowCard}>
          <div style={styles.eq} aria-hidden="true">
            <span style={styles.eqBar1}></span>
            <span style={styles.eqBar2}></span>
            <span style={styles.eqBar3}></span>
          </div>
          <div style={styles.art} />
          <div>
            <div style={styles.nowLabel}>NOW PLAYING</div>
            <div style={styles.nowTitle}>
              {data.playing ? data.playing.songName || data.playing.name : "Nothing playing yet"}
            </div>
            {data.playing && <div style={styles.nowSub}>submitted by {data.playing.name}</div>}
          </div>
        </div>

        <p style={styles.sectionLabel}>UP NEXT ({filteredQueue.length})</p>
        {filteredQueue.length === 0 ? (
          <p style={styles.empty}>{search ? "No matches." : "Queue's empty right now."}</p>
        ) : (
          filteredQueue.map((item) => (
            <div key={item.id} style={styles.row}>
              <div style={styles.rowArt} />
              <div>
                <div style={styles.rowTitle}>{item.songName || "(untitled)"}</div>
                <div style={styles.rowSub}>{item.name}</div>
              </div>
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
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  title: {
    fontFamily: "var(--font-head)",
    fontWeight: 800,
    fontSize: "1.6rem",
    margin: 0,
  },
  submitLink: {
    color: "var(--cyan)",
    fontSize: "0.85rem",
    fontWeight: 600,
    textDecoration: "none",
  },
  search: {
    width: "100%",
    background: "var(--panel-raised)",
    border: "1px solid var(--line)",
    borderRadius: 100,
    padding: "12px 18px",
    color: "var(--text)",
    fontSize: "0.9rem",
    marginBottom: 18,
    outline: "none",
  },
  nowCard: {
    background:
      "linear-gradient(135deg, rgba(79,216,245,0.08), rgba(155,107,255,0.08))",
    border: "1px solid var(--cyan)",
    borderRadius: "var(--radius-md)",
    padding: 14,
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 26,
    boxShadow: "0 0 20px rgba(79,216,245,0.15)",
  },
  eq: {
    display: "flex",
    alignItems: "flex-end",
    gap: 2,
    height: 20,
    flexShrink: 0,
  },
  eqBar1: {
    width: 3,
    height: "60%",
    background: "var(--gradient)",
    borderRadius: 2,
    animation: "viz-bounce 0.9s ease-in-out infinite",
  },
  eqBar2: {
    width: 3,
    height: "100%",
    background: "var(--gradient)",
    borderRadius: 2,
    animation: "viz-bounce 0.9s ease-in-out infinite 0.2s",
  },
  eqBar3: {
    width: 3,
    height: "40%",
    background: "var(--gradient)",
    borderRadius: 2,
    animation: "viz-bounce 0.9s ease-in-out infinite 0.4s",
  },
  art: {
    width: 44,
    height: 44,
    borderRadius: 8,
    background: "linear-gradient(rgba(5,6,14,0.35), rgba(5,6,14,0.55)), url(/logo.jpg)",
    backgroundSize: "cover",
    backgroundPosition: "center",
    border: "1px solid var(--line)",
    flexShrink: 0,
  },
  nowLabel: {
    fontSize: "0.68rem",
    color: "var(--cyan)",
    letterSpacing: "0.1em",
    marginBottom: 2,
  },
  nowTitle: {
    fontWeight: 700,
    fontSize: "0.98rem",
  },
  nowSub: {
    fontSize: "0.78rem",
    color: "var(--text-dim)",
    marginTop: 2,
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
  row: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "11px 4px",
    borderBottom: "1px solid var(--line)",
  },
  rowArt: {
    width: 40,
    height: 40,
    borderRadius: 7,
    background: "linear-gradient(rgba(5,6,14,0.35), rgba(5,6,14,0.55)), url(/logo.jpg)",
    backgroundSize: "cover",
    backgroundPosition: "center",
    border: "1px solid var(--line)",
    flexShrink: 0,
  },
  rowTitle: {
    fontWeight: 600,
    fontSize: "0.92rem",
  },
  rowSub: {
    color: "var(--text-dim)",
    fontSize: "0.78rem",
  },
};
