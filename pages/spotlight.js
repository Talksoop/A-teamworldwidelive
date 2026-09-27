import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import SiteNav from "../lib/SiteNav";
import SiteFooter from "../lib/SiteFooter";
import { parseLink, PLATFORM_LABELS } from "../lib/linkParse";

const CLIP_SECONDS = 30;

function timeAgo(dateString) {
  const ms = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
}

function PlatformBadge({ link }) {
  const { platform } = parseLink(link);
  if (platform === "link") return null;
  return <span style={styles.platformBadge}>{PLATFORM_LABELS[platform]}</span>;
}

// Plays a 30-second clip and then stops itself, whatever the source:
// - our own uploads: a real <audio>/<video> element, paused once
//   currentTime crosses CLIP_SECONDS.
// - an embeddable link (YouTube/Spotify/SoundCloud/TikTok): an autoplaying
//   iframe that gets unmounted after CLIP_SECONDS -- destroying the iframe
//   is what actually stops the audio, since we can't reach into a
//   cross-origin embed to pause it directly.
// - anything else (a plain link we can't embed): no inline clip is
//   possible, so this just offers to open the original link instead.
function SpotlightClip({ s, isPlaying, onPlay, onStop }) {
  const mediaRef = useRef(null);

  useEffect(() => {
    if (!isPlaying) return;
    if (s.sourceType === "UPLOAD") return; // handled by onTimeUpdate below
    const timer = setTimeout(onStop, CLIP_SECONDS * 1000);
    return () => clearTimeout(timer);
  }, [isPlaying, s.sourceType, onStop]);

  if (s.sourceType === "UPLOAD" && s.playUrl) {
    const isVideo = s.link.endsWith(".mp4");
    if (!isPlaying) {
      return (
        <button style={styles.playBtn} onClick={onPlay}>
          ▶ Play 30-sec clip
        </button>
      );
    }
    const El = isVideo ? "video" : "audio";
    return (
      <div>
        <El
          ref={mediaRef}
          style={isVideo ? styles.videoPlayer : styles.audioPlayer}
          src={s.playUrl}
          controls
          autoPlay
          onTimeUpdate={(e) => {
            if (e.currentTarget.currentTime >= CLIP_SECONDS) onStop();
          }}
          onEnded={onStop}
        />
        <button style={styles.stopBtn} onClick={onStop}>
          ■ Stop
        </button>
      </div>
    );
  }

  const { embedUrl } = parseLink(s.link);
  if (embedUrl) {
    if (!isPlaying) {
      return (
        <button style={styles.playBtn} onClick={onPlay}>
          ▶ Play 30-sec clip
        </button>
      );
    }
    return (
      <div>
        <iframe
          style={styles.embedFrame}
          src={embedUrl}
          allow="autoplay; encrypted-media"
          frameBorder="0"
        />
        <button style={styles.stopBtn} onClick={onStop}>
          ■ Stop
        </button>
      </div>
    );
  }

  // Can't be embedded (e.g. a plain Instagram link) -- no inline clip.
  return (
    <a style={styles.playBtn} href={s.link} target="_blank" rel="noreferrer">
      ▶ Listen on {PLATFORM_LABELS[parseLink(s.link).platform] || "the original link"}
    </a>
  );
}

export default function Spotlight() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [playingId, setPlayingId] = useState(null);

  useEffect(() => {
    fetch("/api/spotlight")
      .then((r) => {
        if (!r.ok) throw new Error("Couldn't load the Spotlight page.");
        return r.json();
      })
      .then(setItems)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <>
      <Head>
        <title>Spotlight — A-Team Worldwide Live</title>
      </Head>
      <SiteNav />
      <main style={styles.main}>
        <p style={styles.eyebrow}>★ SPOTLIGHT</p>
        <h1 style={styles.title}>Spotlight Artists</h1>
        <p style={styles.sub}>
          Songs creators across the platform are spotlighting right now. Each pick stays up for
          24 hours from the moment its creator features it.
        </p>

        {error && <p style={styles.error}>{error}</p>}

        {!items ? null : items.length === 0 ? (
          <p style={styles.empty}>
            Nothing spotlighted right now — check back soon, or ask a creator to spotlight your
            track after a great live review.
          </p>
        ) : (
          <ul style={styles.list}>
            {items.map((s) => (
              <li key={s.id} style={styles.card}>
                <div style={styles.cardTop}>
                  <p style={styles.songName}>{s.songName || "Untitled"}</p>
                  {s.sourceType !== "UPLOAD" && <PlatformBadge link={s.link} />}
                </div>
                <p style={styles.submittedBy}>Submitted by {s.name}</p>
                {s.host && (
                  <a style={styles.spotlightedBy} href={`/h/${s.host.slug}`}>
                    ★ Spotlighted by {s.host.name}
                  </a>
                )}
                <p style={styles.timeAgo}>{timeAgo(s.spotlightedAt)}</p>

                <div style={styles.playerWrap}>
                  <SpotlightClip
                    s={s}
                    isPlaying={playingId === s.id}
                    onPlay={() => setPlayingId(s.id)}
                    onStop={() => setPlayingId((cur) => (cur === s.id ? null : cur))}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
      <SiteFooter />
    </>
  );
}

const styles = {
  main: {
    maxWidth: 460,
    margin: "0 auto",
    padding: "28px 20px 40px",
  },
  eyebrow: {
    fontSize: "0.7rem",
    fontWeight: 700,
    letterSpacing: "0.14em",
    color: "#ffd14f",
    margin: "0 0 8px",
  },
  title: {
    fontFamily: "var(--font-head)",
    fontWeight: 800,
    fontSize: "1.9rem",
    margin: "0 0 10px",
  },
  sub: {
    color: "var(--text-dim)",
    fontSize: "0.92rem",
    lineHeight: 1.55,
    margin: "0 0 26px",
  },
  error: {
    color: "var(--live)",
    fontSize: "0.85rem",
  },
  empty: {
    color: "var(--text-dim)",
    fontSize: "0.9rem",
  },
  list: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  card: {
    background: "linear-gradient(135deg, rgba(255,209,79,0.08), rgba(255,209,79,0.02))",
    border: "1px solid rgba(255,209,79,0.4)",
    borderRadius: "var(--radius-md)",
    boxShadow: "0 0 20px rgba(255,209,79,0.08)",
    padding: "18px 20px",
  },
  cardTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 4,
  },
  songName: {
    fontWeight: 700,
    fontSize: "1.05rem",
    margin: 0,
  },
  submittedBy: {
    color: "var(--text-dim)",
    fontSize: "0.82rem",
    margin: "0 0 6px",
  },
  spotlightedBy: {
    display: "inline-block",
    color: "#ffd14f",
    fontSize: "0.8rem",
    fontWeight: 700,
    textDecoration: "none",
    margin: "0 0 4px",
  },
  timeAgo: {
    color: "var(--text-dim)",
    fontSize: "0.74rem",
    margin: "0 0 14px",
    opacity: 0.8,
  },
  playerWrap: {
    marginTop: 4,
  },
  platformBadge: {
    fontSize: "0.7rem",
    color: "var(--text-dim)",
    border: "1px solid var(--line)",
    borderRadius: 4,
    padding: "1px 6px",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  playBtn: {
    display: "inline-block",
    background: "var(--gradient)",
    color: "#05060e",
    fontWeight: 700,
    fontSize: "0.85rem",
    padding: "9px 16px",
    borderRadius: "var(--radius-sm)",
    border: "none",
    textDecoration: "none",
    cursor: "pointer",
  },
  stopBtn: {
    display: "block",
    marginTop: 8,
    background: "transparent",
    border: "1px solid var(--line)",
    color: "var(--text-dim)",
    fontWeight: 700,
    fontSize: "0.8rem",
    padding: "6px 14px",
    borderRadius: "var(--radius-sm)",
    cursor: "pointer",
  },
  audioPlayer: {
    width: "100%",
    height: 40,
  },
  videoPlayer: {
    width: "100%",
    borderRadius: "var(--radius-sm)",
  },
  embedFrame: {
    width: "100%",
    height: 152,
    border: "none",
    borderRadius: "var(--radius-sm)",
  },
};
