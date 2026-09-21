import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { useQueueSocket } from "../../../lib/useQueueSocket";
import { parseLink } from "../../../lib/linkParse";

export default function Overlay() {
  const router = useRouter();
  const { slug } = router.query;
  const [data, setData] = useState({ playing: null, queue: [] });
  const [battle, setBattle] = useState(null);
  const [submitUrl, setSubmitUrl] = useState("");
  const [hostId, setHostId] = useState(null);

  const load = useCallback(async () => {
    if (!slug) return;
    try {
      const res = await fetch(`/api/current?slug=${slug}`);
      const json = await res.json();
      setData(json);
      if (json.hostId) setHostId(json.hostId);
    } catch {
      // Silently retry on the next update — an overlay shouldn't show errors on stream.
    }
  }, [slug]);

  const loadBattle = useCallback(async () => {
    if (!slug) return;
    try {
      const res = await fetch(`/api/current-battle?slug=${slug}`);
      const json = await res.json();
      setBattle(json.battle);
      if (json.hostId) setHostId(json.hostId);
    } catch {
      // keep whatever we last had
    }
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    setSubmitUrl(`${window.location.origin}/h/${slug}/submit`);
    load();
    loadBattle();
  }, [slug, load, loadBattle]);

  useQueueSocket(hostId, load);
  useQueueSocket(hostId, loadBattle, "battle-updated");

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
              {data.playing.sourceType === "UPLOAD" ? (
                <Waveform key={data.playing.id} src={data.playing.playUrl} />
              ) : (
                <div className="visualizer" aria-hidden="true">
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              )}
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
              {data.playing.sourceType !== "UPLOAD" &&
                (() => {
                  const { embedUrl } = parseLink(data.playing.link);
                  if (!embedUrl) return null;
                  return (
                    <div style={styles.playerWrap}>
                      <iframe
                        key={data.playing.id}
                        style={styles.embedFrame}
                        src={embedUrl}
                        allow="autoplay; encrypted-media"
                        frameBorder="0"
                      />
                    </div>
                  );
                })()}
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

// Real frequency-based waveform for our own uploaded audio, driven by the
// Web Audio API AnalyserNode — this is an actual signal reading, not a
// canned animation. Falls back silently (keeps rendering a flat/idle bar) if
// the browser blocks it for any reason (e.g. autoplay policy, CORS).
function Waveform({ src }) {
  const audioElRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!src) return undefined;

    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    audio.src = src;
    audio.autoplay = false; // this hidden element is analysis-only; the visible <audio>/<video> below does the real playback
    audio.muted = true;
    audioElRef.current = audio;

    let audioCtx;
    let analyser;
    let animationId;
    let cancelled = false;

    async function start() {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioCtx.createMediaElementSource(audio);
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyser.connect(audioCtx.destination);
        await audio.play();
      } catch {
        cancelled = true;
        return;
      }
      if (cancelled) return;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      function draw() {
        animationId = requestAnimationFrame(draw);
        if (!ctx) return;
        analyser.getByteFrequencyData(dataArray);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const barWidth = canvas.width / bufferLength;
        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height;
          ctx.fillStyle = i % 2 === 0 ? "#4fd8f5" : "#9b6bff";
          ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth - 2, barHeight);
        }
      }
      draw();
    }
    start();

    return () => {
      cancelled = true;
      if (animationId) cancelAnimationFrame(animationId);
      audio.pause();
      audioCtx?.close().catch(() => {});
    };
  }, [src]);

  return <canvas ref={canvasRef} width={260} height={26} style={{ width: "100%", height: 26 }} />;
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
    border: "1px solid var(--line-soft)",
    boxShadow: "var(--shadow-md)",
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
  embedFrame: {
    width: "100%",
    height: 152,
    border: "none",
    borderRadius: 8,
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
