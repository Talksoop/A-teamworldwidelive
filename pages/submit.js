import { useState } from "react";
import Head from "next/head";

export default function Submit() {
  const [name, setName] = useState("");
  const [link, setLink] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState("idle"); // idle | sending | done | error
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, link, message }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Couldn't submit that. Try again.");
      }
      setState("done");
      setName("");
      setLink("");
      setMessage("");
    } catch (err) {
      setState("error");
      setError(err.message);
    }
  }

  if (state === "done") {
    return (
      <main style={styles.main}>
        <div style={styles.card}>
          <div style={styles.pulse} aria-hidden="true" />
          <h1 style={styles.doneTitle}>You're in the queue</h1>
          <p style={styles.doneSub}>Keep an eye on the stream — it'll play when it's up.</p>
          <button style={styles.secondaryBtn} onClick={() => setState("idle")}>
            Submit another
          </button>
        </div>
      </main>
    );
  }

  return (
    <>
      <Head>
        <title>Submit a track — A-Team Worldwide Live</title>
      </Head>
      <main style={styles.main}>
        <form style={styles.card} onSubmit={handleSubmit}>
          <h1 style={styles.title}>Submit a track</h1>
          <p style={styles.sub}>Paste a link. It goes straight into the review queue.</p>

          <label style={styles.label}>
            Your name
            <input
              style={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              required
              placeholder="e.g. Jordan"
            />
          </label>

          <label style={styles.label}>
            Link
            <input
              style={styles.input}
              value={link}
              onChange={(e) => setLink(e.target.value)}
              type="url"
              maxLength={500}
              required
              placeholder="https://open.spotify.com/track/..."
            />
          </label>

          <label style={styles.label}>
            Message (optional)
            <textarea
              style={{ ...styles.input, height: 80, resize: "vertical" }}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={300}
              placeholder="Anything you want said before it plays"
            />
          </label>

          {error && <p style={styles.error}>{error}</p>}

          <button style={styles.primaryBtn} type="submit" disabled={state === "sending"}>
            {state === "sending" ? "Sending…" : "Send it in"}
          </button>
        </form>
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
  card: {
    width: "100%",
    maxWidth: 420,
    background: "var(--panel)",
    border: "1px solid var(--line)",
    borderRadius: 12,
    padding: "32px 28px",
    display: "flex",
    flexDirection: "column",
    textAlign: "center",
  },
  title: {
    fontFamily: "var(--font-head)",
    fontWeight: 800,
    fontSize: "1.8rem",
    margin: "0 0 6px",
  },
  sub: {
    color: "var(--text-dim)",
    fontSize: "0.92rem",
    margin: "0 0 24px",
  },
  label: {
    textAlign: "left",
    fontSize: "0.85rem",
    color: "var(--text-dim)",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    marginBottom: 16,
  },
  input: {
    background: "var(--panel-raised)",
    border: "1px solid var(--line)",
    borderRadius: 8,
    padding: "10px 12px",
    color: "var(--text)",
    fontSize: "0.95rem",
    outline: "none",
  },
  error: {
    color: "var(--live)",
    fontSize: "0.85rem",
    margin: "0 0 12px",
  },
  primaryBtn: {
    background: "var(--gradient)",
    color: "#05060e",
    border: "none",
    fontWeight: 600,
    padding: "12px",
    borderRadius: 8,
    fontSize: "0.95rem",
    marginTop: 4,
  },
  secondaryBtn: {
    background: "transparent",
    border: "1px solid var(--line)",
    color: "var(--text)",
    fontWeight: 500,
    padding: "10px 20px",
    borderRadius: 8,
    fontSize: "0.9rem",
    marginTop: 8,
    alignSelf: "center",
  },
  pulse: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: "var(--gradient)",
    margin: "0 auto 16px",
  },
  doneTitle: {
    fontFamily: "var(--font-head)",
    fontWeight: 800,
    fontSize: "1.6rem",
    margin: "0 0 8px",
  },
  doneSub: {
    color: "var(--text-dim)",
    fontSize: "0.92rem",
    margin: "0 0 20px",
  },
};
