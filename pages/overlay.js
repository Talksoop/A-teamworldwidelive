import { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import { useQueueSocket } from "../lib/useQueueSocket";

export default function Overlay() {
  const [data, setData] = useState({ playing: null, queue: [] });
  const [battle, setBattle] = useState(null);
  const [submitUrl, setSubmitUrl] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/current");
      const json = await res.json();
      setData(json);
    } catch {
      // Silently retry on the next update — an overlay shouldn't show errors on stream.
    }
  }, []);

  const loadBattle = useCallback(async () => {
    try {
      const res = await fetch("/api/current-battle");
      const json = await res.json();
      setBattle(json.battle);
    } catch {
      // keep whatever we last had
    }
  }, []);

  useEffect(() => {
    setSubmitUrl(`${window.location.origin}/submit`);
    load();
    loadBattle();
  }, [load, loadBattle]);

  useQueueSocket(load);
  useQueueSocket(loadBattle, "battle-updated");

  const battleTotal = battle ? battle.votesA + battle.votesB : 0;
  const battlePctA = battleTotal > 0 ? Math.round((battle.votesA / battleTotal) * 100) : 50;

  return (
    <>
      <Head>
        <title>A-Team Worldwide Live</title>
      </Head>
      <main style={styles.main}>
        {battle && (
          <section style={styles.battleCard}>
            <div style={styles.liveTag}>
              <span style={styles.liveDot} aria-hidden="true" />
              Battle live
            </div>
            <div style={styles.battleRow}>
              <span style={styles.battleName}>{battle.songA?.songName || "Song A"}</span>
              <span style={styles.battleVotes}>{battle.votesA}</span>
            </div>
            <div style={styles.battleBarWrap}>
              <div style={{ ...styles.battleBar, width: `${battlePctA}%` }} />
            </div>
            <div style={styles.battleRow}>
              <span style={styles.battleName}>{battle.songB?.songName || "Song B"}</span>
              <span style={styles.battleVotes}>{battle.votesB}</span>
            </div>
          </section>
        )}

        <section style={styles.nowPlaying}>
          <div style={styles.liveTag}>
            <span style={styles.liveDot} aria-hidden="true" />
            Now playing
          </div>
          {data.playing ? (
            <>
              <p style={styles.trackName}>{data.playing.songName || data.playing.name}</p>
              <div className="visualizer" aria-hidden="true">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>
              <p style={styles.trackSubmitter}>submitted by {data.playing.name}</p>
              {data.playing.message && <p style={styles.trackMsg}>“{data.playing.message}”</p>}
              {data.playing.sourceType === "UPLOAD" && data.playing.playUrl && (
                <div style={styles.playerWrap}>
                  {data.playing.link.endsWith(".mp4") ? (
                    <video
                      key={data.playing.id}
                      style={styles.player}
                      src={data.playing.playUrl}
                      controls
                      autoPlay
                    />
                  ) : (
                    <audio
                      key={data.playing.id}
                      style={styles.player}
                      src={data.playing.playUrl}
                      controls
                      autoPlay
                    />
                  )}
                </div>
              )}
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
                  {item.songName || item.name}
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
  battleCard: {
    background: "var(--panel)",
    border: "1px solid var(--purple)",
    boxShadow: "var(--glow-purple)",
    borderRadius: 12,
    padding: "18px 20px",
  },
  battleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginTop: 8,
  },
  battleName: {
    fontFamily: "var(--font-head)",
    fontWeight: 700,
    fontSize: "1rem",
  },
  battleVotes: {
    color: "var(--cyan)",
    fontWeight: 700,
    fontSize: "0.9rem",
  },
  battleBarWrap: {
    height: 8,
    background: "var(--line)",
    borderRadius: 4,
    overflow: "hidden",
    marginTop: 6,
  },
  battleBar: {
    height: "100%",
    background: "var(--gradient)",
  },
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
    fontWeight: 800,
    fontSize: "1.5rem",
    margin: 0,
  },
  trackMsg: {
    color: "var(--text-dim)",
    fontSize: "0.9rem",
    marginTop: 8,
    marginBottom: 0,
  },
  trackSubmitter: {
    color: "var(--text-dim)",
    fontSize: "0.85rem",
    margin: "4px 0 0",
  },
  playerWrap: {
    marginTop: 12,
  },
  player: {
    width: "100%",
    maxHeight: 220,
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
