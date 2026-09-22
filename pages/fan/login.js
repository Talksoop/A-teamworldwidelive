import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

const GOOGLE_ERRORS = {
  google_denied: "Google sign-in was cancelled.",
  google_state: "That Google sign-in link expired — try again.",
  google_failed: "Couldn't complete Google sign-in. Try again.",
  google_no_email: "Your Google account didn't share an email address — try a different sign-in method.",
};

export default function FanLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (router.query.error && GOOGLE_ERRORS[router.query.error]) {
      setError(GOOGLE_ERRORS[router.query.error]);
    }
  }, [router.query.error]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSending(true);
    setError("");
    const res = await fetch("/api/fan/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    setSending(false);
    if (!res.ok) {
      setError(data.error || "Couldn't log in.");
      return;
    }
    router.push("/discover");
  }

  return (
    <>
      <Head>
        <title>Log in — A-Team Worldwide Live</title>
      </Head>
      <main style={styles.main}>
        <form style={styles.card} onSubmit={handleSubmit}>
          <h1 style={styles.title}>Welcome back</h1>
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
            placeholder="Password"
            required
          />
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.btn} type="submit" disabled={sending}>
            {sending ? "Logging in…" : "Log in"}
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
          <a style={styles.link} href="/fan/signup">
            Need an account? Sign up
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
