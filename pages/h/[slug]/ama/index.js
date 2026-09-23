import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import SiteNav from "../../../../lib/SiteNav";

function formatPrice(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function Ama() {
  const router = useRouter();
  const { slug } = router.query;
  const [settings, setSettings] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [question, setQuestion] = useState("");
  const [link, setLink] = useState("");
  const [state, setState] = useState("idle"); // idle | sending | error
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/ama-settings?slug=${slug}`)
      .then((r) => r.json())
      .then(setSettings);
    if (router.query.canceled) {
      setError("Checkout was canceled — nothing was charged.");
    }
  }, [slug, router.query.canceled]);

  useEffect(() => {
    fetch("/api/fan/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((fan) => {
        if (fan) {
          setName((prev) => prev || fan.name);
          setEmail((prev) => prev || fan.email);
        }
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/ama", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, name, email: email || undefined, question, link }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't send that. Try again.");
      if (data.free) {
        router.push(`/h/${slug}/ama/${data.token}`);
      } else {
        window.location.href = data.url;
      }
    } catch (err) {
      setState("error");
      setError(err.message);
    }
  }

  if (settings && !settings.amaEnabled) {
    return (
      <>
        <Head>
          <title>Private request — A-Team Worldwide Live</title>
        </Head>
        <SiteNav slug={slug} />
        <main style={styles.main}>
          <div style={styles.card}>
            <h1 style={styles.title}>Not open right now</h1>
            <p style={styles.sub}>Private requests aren't being accepted at the moment.</p>
            <div style={styles.doneBtns}>
              <a style={styles.secondaryBtn} href={`/h/${slug}`}>
                Back to channel
              </a>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Private request — A-Team Worldwide Live</title>
      </Head>
      <SiteNav slug={slug} />
      <main style={styles.main}>
        <div style={styles.miniBanner}>
          <div style={styles.miniBannerRule}>
            <div style={{ ...styles.miniRuleLine, background: "linear-gradient(90deg, transparent, var(--cyan))" }} />
            <div style={{ ...styles.miniRuleLine, background: "linear-gradient(90deg, var(--purple), transparent)" }} />
          </div>
          <div className="glow-text" style={styles.miniBannerWord}>
            A-TEAM
          </div>
        </div>
        <form style={styles.card} onSubmit={handleSubmit}>
          <h1 style={styles.title}>Private request</h1>
          <p style={styles.sub}>
            {settings
              ? settings.amaPriceCents > 0
                ? `${formatPrice(settings.amaPriceCents)} for a private, personal reply — not on stream.`
                : "A private, personal reply — not on stream."
              : ""}
          </p>

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
            Email (optional — get notified when you get a reply)
            <input
              style={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={200}
              placeholder="you@example.com"
            />
          </label>

          <label style={styles.label}>
            Your question
            <textarea
              style={{ ...styles.input, height: 110, resize: "vertical" }}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={1000}
              required
              placeholder="What do you want to ask, or what should I review?"
            />
          </label>

          <label style={styles.label}>
            Link (optional)
            <input
              style={styles.input}
              value={link}
              onChange={(e) => setLink(e.target.value)}
              type="url"
              maxLength={500}
              placeholder="A track, video, or profile to look at"
            />
          </label>

          {error && <p style={styles.error}>{error}</p>}

          <button style={styles.primaryBtn} type="submit" disabled={state === "sending"}>
            {state === "sending"
              ? "Sending…"
              : settings?.amaPriceCents > 0
              ? `Pay ${formatPrice(settings.amaPriceCents)} & send`
              : "Send"}
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
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
  },
  miniBanner: {
    width: "100%",
    maxWidth: 440,
    textAlign: "center",
    marginBottom: 16,
  },
  miniBannerRule: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  miniRuleLine: {
    flex: 1,
    height: 1,
  },
  miniBannerWord: {
    fontFamily: "var(--font-head)",
    fontWeight: 800,
    fontSize: "1.1rem",
    letterSpacing: "0.06em",
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
    textAlign: "center",
  },
  title: {
    fontFamily: "var(--font-head)",
    fontWeight: 800,
    fontSize: "1.6rem",
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
    fontWeight: 700,
    padding: "12px",
    borderRadius: 8,
    fontSize: "0.95rem",
    marginTop: 4,
    boxShadow: "var(--glow-purple)",
  },
  doneBtns: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
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
    textDecoration: "none",
    textAlign: "center",
  },
};
