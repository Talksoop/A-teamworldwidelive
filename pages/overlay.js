import { useEffect, useState } from "react";
import Head from "next/head";

const POLL_MS = 4000;

export default function Overlay() {
  const [data, setData] = useState({ playing: null, queue: [] });
  const [submitUrl, setSubmitUrl] = useState("");

  useEffect(() => {
    setSubmitUrl(`${window.location.origin}/submit`);

    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch("/api/current");
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch {
        // Silently retry on the next tick — an overlay shouldn't show errors on stream.
      }
    }
    poll();
    const id = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <>
      <Head>
        <title>Aux Cord — Live</title>
      </Head>
      <main style={styles.main}>
        <section style={styles.nowPlaying}>
          <div style={styles.liveTag}>
            <span style={styles.liveDot} aria-hidden="true" />
            Now playing
          </div>
          {data.playing ? (
            <>
              <p style={styles.trackName}>{data.playing.name}</p>
              {data.playing.message && <p style={styles.trackMsg}>“{data.playing.message}”</p>}
            </>
          ) : (
            <p style={styles.idle}>Nothing queued up yet</p>
          )}
        </section>

        <section style={styles.queueSection}>
          <p style={styles.queueLabel}>Up next</p>
          {data.queue.length === 0 ? (
            <p style={styles.idle}>Queue's empty</p>
          ) : (
            <ol style={styles.queueList}>
              {data.queue.slice(0, 6).map((item) => (
                <li key={item.id} style={styles.queueItem}>
                  {item.name}
                </li>
              ))}
            </ol>
          )}
        </section>

        <section style={styles.submitPrompt}>
          Submit yours at <strong>{submitUrl.replace(/^https?:\/\//, "")}</strong>
        </section>
      </main>
    </>
  );
}

const styles = {
  main: {
    minHeight: "100vh",
    padding: "32px",
    display: "flex",
    flexDirection: "column",
    gap: 28,
    maxWidth: 480,
  },
  nowPlaying: {
    background: "var(--panel)",
    border: "1px solid var(--line)",
    borderRadius: 12,
    padding: "20px 22px",
  },
  liveTag: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "var(--live)",
    fontSize: "0.8rem",
    fontWeight: 600,
    marginBottom: 10,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "var(--live)",
  },
  trackName: {
    fontFamily: "var(--font-head)",
    fontWeight: 700,
    fontSize: "1.5rem",
    margin: 0,
  },
  trackMsg: {
    color: "var(--text-dim)",
    fontSize: "0.9rem",
    marginTop: 8,
    marginBottom: 0,
  },
  idle: {
    color: "var(--text-dim)",
    fontSize: "0.9rem",
    margin: 0,
  },
  queueSection: {
    padding: "0 4px",
  },
  queueLabel: {
    fontSize: "0.8rem",
    color: "var(--text-dim)",
    margin: "0 0 10px",
  },
  queueList: {
    listStyle: "decimal",
    paddingLeft: 20,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: 6,
    color: "var(--text)",
    fontSize: "0.95rem",
  },
  queueItem: {
    paddingLeft: 4,
  },
  submitPrompt: {
    fontSize: "0.85rem",
    color: "var(--text-dim)",
    borderTop: "1px solid var(--line)",
    paddingTop: 16,
  },
};
