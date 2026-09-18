import { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import { isAuthed } from "../lib/auth";

export async function getServerSideProps({ req }) {
  if (!isAuthed(req)) {
    return { redirect: { destination: "/login", permanent: false } };
  }
  return { props: {} };
}

const POLL_MS = 4000;

export default function Admin() {
  const [submissions, setSubmissions] = useState([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/submissions");
    if (res.status === 401) {
      window.location.href = "/login";
      return;
    }
    const data = await res.json();
    setSubmissions(data);
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  async function updateStatus(id, status) {
    setError("");
    const res = await fetch(`/api/submissions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      setError("That didn't go through. Try again.");
      return;
    }
    load();
  }

  const pending = submissions.filter((s) => s.status === "PENDING");
  const queued = submissions.filter((s) => s.status === "QUEUED");
  const playing = submissions.find((s) => s.status === "PLAYING");

  return (
    <>
      <Head>
        <title>Admin — A-Team Worldwide Live</title>
      </Head>
      <main style={styles.main}>
        <h1 style={styles.title}>Queue control</h1>
        {error && <p style={styles.error}>{error}</p>}

        <section style={styles.section}>
          <p style={styles.sectionLabel}>Now playing</p>
          {playing ? (
            <div style={styles.playingCard}>
              <div>
                <p style={styles.name}>{playing.name}</p>
                <a style={styles.link} href={playing.link} target="_blank" rel="noreferrer">
                  {playing.link}
                </a>
                {playing.message && <p style={styles.msg}>“{playing.message}”</p>}
              </div>
              <button style={styles.doneBtn} onClick={() => updateStatus(playing.id, "DONE")}>
                Mark done
              </button>
            </div>
          ) : (
            <p style={styles.empty}>Nothing playing — pick from the queue below</p>
          )}
        </section>

        <section style={styles.section}>
          <p style={styles.sectionLabel}>Queue ({queued.length})</p>
          {queued.length === 0 ? (
            <p style={styles.empty}>Queue is empty</p>
          ) : (
            <ul style={styles.list}>
              {queued.map((s) => (
                <li key={s.id} style={styles.row}>
                  <div>
                    <p style={styles.name}>{s.name}</p>
                    <a style={styles.link} href={s.link} target="_blank" rel="noreferrer">
                      {s.link}
                    </a>
                  </div>
                  <button style={styles.playBtn} onClick={() => updateStatus(s.id, "PLAYING")}>
                    Play
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section style={styles.section}>
          <p style={styles.sectionLabel}>Pending review ({pending.length})</p>
          {pending.length === 0 ? (
            <p style={styles.empty}>Nothing new</p>
          ) : (
            <ul style={styles.list}>
              {pending.map((s) => (
                <li key={s.id} style={styles.row}>
                  <div>
                    <p style={styles.name}>{s.name}</p>
                    <a style={styles.link} href={s.link} target="_blank" rel="noreferrer">
                      {s.link}
                    </a>
                    {s.message && <p style={styles.msg}>“{s.message}”</p>}
                  </div>
                  <div style={styles.rowBtns}>
                    <button style={styles.playBtn} onClick={() => updateStatus(s.id, "QUEUED")}>
                      Add to queue
                    </button>
                    <button
                      style={styles.rejectBtn}
                      onClick={() => updateStatus(s.id, "REJECTED")}
                    >
                      Reject
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}

const styles = {
  main: {
    maxWidth: 640,
    margin: "0 auto",
    padding: "32px 20px 80px",
  },
  title: {
    fontFamily: "var(--font-head)",
    fontWeight: 800,
    fontSize: "1.8rem",
    margin: "0 0 28px",
  },
  error: {
    color: "var(--live)",
    fontSize: "0.85rem",
  },
  section: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: "0.8rem",
    color: "var(--text-dim)",
    textTransform: "none",
    margin: "0 0 12px",
    fontWeight: 500,
  },
  empty: {
    color: "var(--text-dim)",
    fontSize: "0.9rem",
    margin: 0,
  },
  playingCard: {
    background: "var(--panel)",
    border: "1px solid var(--purple)",
    boxShadow: "var(--glow-purple)",
    borderRadius: 10,
    padding: "16px 18px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  list: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  row: {
    background: "var(--panel)",
    border: "1px solid var(--line)",
    borderRadius: 10,
    padding: "14px 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  rowBtns: {
    display: "flex",
    gap: 8,
    flexShrink: 0,
  },
  name: {
    fontWeight: 600,
    margin: "0 0 2px",
    fontSize: "0.95rem",
  },
  link: {
    fontSize: "0.8rem",
    color: "var(--text-dim)",
    wordBreak: "break-all",
  },
  msg: {
    fontSize: "0.85rem",
    color: "var(--text-dim)",
    margin: "6px 0 0",
  },
  playBtn: {
    background: "var(--gradient)",
    color: "#05060e",
    border: "none",
    fontWeight: 600,
    padding: "8px 16px",
    borderRadius: 7,
    fontSize: "0.85rem",
    whiteSpace: "nowrap",
  },
  doneBtn: {
    background: "transparent",
    border: "1px solid var(--line)",
    color: "var(--text)",
    fontWeight: 500,
    padding: "8px 16px",
    borderRadius: 7,
    fontSize: "0.85rem",
    whiteSpace: "nowrap",
  },
  rejectBtn: {
    background: "transparent",
    border: "1px solid var(--line)",
    color: "var(--text-dim)",
    fontWeight: 500,
    padding: "8px 14px",
    borderRadius: 7,
    fontSize: "0.85rem",
    whiteSpace: "nowrap",
  },
};
