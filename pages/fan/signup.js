import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

export default function FanSignup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setSending(true);
    setError("");
    const res = await fetch("/api/fan/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json().catch(() => ({}));
    setSending(false);
    if (!res.ok) {
      setError(data.error || "Couldn't create that account.");
      return;
    }
    router.push("/discover");
  }

  return (
    <>
      <Head>
        <title>Sign up — A-Team Worldwide Live</title>
      </Head>
      <main style={styles.main}>
        <form style={styles.card} onSubmit={handleSubmit}>
          <h1 style={styles.title}>Create your account</h1>
          <p style={styles.sub}>Follow creators, submit tracks, and keep your history in one place.</p>
          <input
            style={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={60}
            required
          />
          <input
            style={styles.input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
          <input
            style={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min 8 characters)"
            required
          />
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.btn} type="submit" disabled={sending}>
            {sending ? "Creating…" : "Create account"}
          </button>
          <div style={styles.divider}>
            <span style={styles.dividerLine} />
            <span>or</span>
            <span style={styles.dividerLine} />
          </div>
          <a
            style={styles.googleBtn}
            href={`/api/auth/google/start?role=fan&returnTo=${encodeURIComponent("/discover")}`}
          >
            Continue with Google
          </a>
          <a style={styles.link} href="/fan/login">
            Already have an account? Log in
          </a>
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
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    display: "flex",
    flexDirection: "column",
    gap: 14,
    background: "var(--panel)",
    border: "1px solid var(--line-soft)",
    boxShadow: "var(--shadow-md)",
    borderRadius: 12,
    padding: "28px 24px",
  },
  title: {
    fontFamily: "var(--font-head)",
    fontWeight: 800,
    fontSize: "1.4rem",
    margin: "0 0 2px",
    textAlign: "center",
  },
  sub: {
    color: "var(--text-dim)",
    fontSize: "0.85rem",
    textAlign: "center",
    margin: "0 0 8px",
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
    margin: 0,
  },
  btn: {
    background: "var(--gradient)",
    color: "#05060e",
    border: "none",
    fontWeight: 700,
    padding: "11px",
    borderRadius: 8,
    fontSize: "0.95rem",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: "var(--text-dim)",
    fontSize: "0.78rem",
    margin: "2px 0",
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: "var(--line-soft)",
  },
  googleBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--panel-raised)",
    border: "1px solid var(--line)",
    color: "var(--text)",
    fontWeight: 600,
    padding: "11px",
    borderRadius: 8,
    fontSize: "0.9rem",
    textDecoration: "none",
  },
  link: {
    textAlign: "center",
    color: "var(--text-dim)",
    fontSize: "0.85rem",
    textDecoration: "underline",
    textUnderlineOffset: 3,
  },
};
