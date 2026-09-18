import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

export default function Login() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setSending(true);
    setError("");
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setSending(false);
    if (!res.ok) {
      setError("Wrong password.");
      return;
    }
    router.push("/admin");
  }

  return (
    <>
      <Head>
        <title>Admin login — Aux Cord</title>
      </Head>
      <main style={styles.main}>
        <form style={styles.card} onSubmit={handleSubmit}>
          <h1 style={styles.title}>Admin</h1>
          <input
            style={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
          />
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.btn} type="submit" disabled={sending}>
            {sending ? "Checking…" : "Log in"}
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
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 320,
    display: "flex",
    flexDirection: "column",
    gap: 14,
    background: "var(--panel)",
    border: "1px solid var(--line)",
    borderRadius: 12,
    padding: "28px 24px",
  },
  title: {
    fontFamily: "var(--font-head)",
    fontWeight: 700,
    fontSize: "1.4rem",
    margin: "0 0 6px",
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
    background: "var(--accent)",
    color: "#15120e",
    border: "none",
    fontWeight: 600,
    padding: "11px",
    borderRadius: 8,
    fontSize: "0.95rem",
  },
};
