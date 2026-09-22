import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import SiteNav from "../../../lib/SiteNav";
import { useQueueSocket } from "../../../lib/useQueueSocket";

export default function Vote() {
  const router = useRouter();
  const { slug } = router.query;
  const [hostId, setHostId] = useState(null);
  const [battle, setBattle] = useState(undefined); // undefined = loading, null = none live
  const [votedFor, setVotedFor] = useState(null);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!slug) return;
    try {
      const res = await fetch(`/api/current-battle?slug=${slug}`);
      const data = await res.json();
      setBattle(data.battle);
      if (data.hostId) setHostId(data.hostId);
      if (data.battle) {
        setVotedFor(localStorage.getItem(`voted-battle-${data.battle.id}`));
      }
    } catch {
      // keep whatever we last had
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  useQueueSocket(hostId, load, "battle-updated");

  async function vote(side) {
    if (!battle || votedFor || voting) return;
    setVoting(true);
    setError("");
    try {
      const res = await fetch(`/api/battles/${battle.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ side }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Vote didn't go through.");
      }
      localStorage.setItem(`voted-battle-${battle.id}`, side);
      setVotedFor(side);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setVoting(false);
    }
  }

  const totalVotes = battle ? battle.votesA + battle.votesB : 0;
  const pctA = totalVotes > 0 ? Math.round((battle.votesA / totalVotes) * 100) : 50;
  const pctB = 100 - pctA;

  return (
    <>
      <Head>
        <title>Vote — A-Team Worldwide Live</title>
      </Head>
      <SiteNav slug={slug} />
      <main style={styles.main}>
        {battle === undefined && <p style={styles.idle}>Loading…</p>}

        {battle === null && (
          <div style={styles.card}>
            <h1 style={styles.title}>No battle right now</h1>
            <p style={styles.sub}>Check back once the host starts one.</p>
          </div>
        )}

        {battle && (
          <div style={styles.card}>
            <div style={styles.liveTag}>
              <span style={styles.liveDot} aria-hidden="true" />
              Vote now
            </div>
            <h1 style={styles.title}>Which one wins?</h1>

            <button
              style={{
                ...styles.option,
                ...(votedFor === "A" ? styles.optionChosen : {}),
              }}
              onClick={() => vote("A")}
              disabled={Boolean(votedFor) || voting}
            >
              <span style={styles.optionName}>{battle.songA?.songName || "Song A"}</span>
              <span style={styles.optionSub}>by {battle.songA?.name}</span>
              {votedFor && (
                <div style={styles.barWrap}>
                  <div style={{ ...styles.bar, width: `${pctA}%` }} />
                  <span style={styles.barLabel}>{pctA}%</span>
                </div>
              )}
            </button>

            <div style={styles.vs}>VS</div>

            <button
              style={{
                ...styles.option,
                ...(votedFor === "B" ? styles.optionChosen : {}),
              }}
              onClick={() => vote("B")}
              disabled={Boolean(votedFor) || voting}
            >
              <span style={styles.optionName}>{battle.songB?.songName || "Song B"}</span>
              <span style={styles.optionSub}>by {battle.songB?.name}</span>
              {votedFor && (
                <div style={styles.barWrap}>
                  <div style={{ ...styles.bar, width: `${pctB}%` }} />
                  <span style={styles.barLabel}>{pctB}%</span>
                </div>
              )}
            </button>

            {error && <p style={styles.error}>{error}</p>}
            {votedFor && <p style={styles.thanks}>Thanks for voting — results update live.</p>}
          </div>
        )}
      </main>
    </>
  );
}

const styles = {
  main: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
  },
  idle: {
    color: "var(--text-dim)",
  },
  card: {
    width: "100%",
    maxWidth: 440,
    background: "var(--panel)",
    border: "1px solid var(--line-soft)",
    boxShadow: "var(--shadow-md)",
    borderRadius: 12,
    padding: "32px 28px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  liveTag: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "var(--live)",
    fontSize: "0.8rem",
    fontWeight: 600,
    marginBottom: 12,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "var(--live)",
  },
  title: {
    fontFamily: "var(--font-head)",
    fontWeight: 800,
    fontSize: "1.5rem",
    margin: "0 0 24px",
  },
  sub: {
    color: "var(--text-dim)",
    fontSize: "0.92rem",
    margin: 0,
  },
  option: {
    width: "100%",
    background: "var(--panel-raised)",
    border: "1px solid var(--line)",
    borderRadius: 10,
    padding: "16px 18px",
    display: "flex",
    flexDirection: "column",
    gap: 4,
    cursor: "pointer",
    marginBottom: 4,
  },
  optionChosen: {
    border: "1px solid var(--cyan)",
    boxShadow: "var(--glow-cyan)",
  },
  optionName: {
    fontWeight: 700,
    fontSize: "1.05rem",
  },
  optionSub: {
    fontSize: "0.8rem",
    color: "var(--text-dim)",
  },
  vs: {
    fontFamily: "var(--font-head)",
    fontWeight: 800,
    color: "var(--text-dim)",
    margin: "8px 0",
    fontSize: "0.85rem",
  },
  barWrap: {
    position: "relative",
    height: 8,
    background: "var(--line)",
    borderRadius: 4,
    marginTop: 8,
    overflow: "hidden",
  },
  bar: {
    height: "100%",
    background: "var(--gradient)",
  },
  barLabel: {
    position: "absolute",
    right: 0,
    top: -18,
    fontSize: "0.75rem",
    color: "var(--text-dim)",
  },
  error: {
    color: "var(--live)",
    fontSize: "0.85rem",
    marginTop: 12,
  },
  thanks: {
    color: "var(--text-dim)",
    fontSize: "0.85rem",
    marginTop: 16,
  },
};
