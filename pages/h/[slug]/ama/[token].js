import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

export default function AmaStatus() {
  const router = useRouter();
  const { token } = router.query;
  const [request, setRequest] = useState(undefined); // undefined = loading, null = not found

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/ama/${token}`);
      if (!res.ok) {
        setRequest(null);
        return;
      }
      setRequest(await res.json());
    } catch {
      // keep last state
    }
  }, [token]);

  useEffect(() => {
    load();
    // Simple slow poll — a fan might have this tab open waiting for a reply.
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [load]);

  return (
    <>
      <Head>
        <title>Your request — A-Team Worldwide Live</title>
      </Head>
      <main style={styles.main}>
        {request === undefined && <p style={styles.idle}>Loading…</p>}

        {request === null && (
          <div style={styles.card}>
            <h1 style={styles.title}>Not found</h1>
            <p style={styles.sub}>This link doesn't match a request. Double-check it's correct.</p>
          </div>
        )}

        {request && (
          <div style={styles.card}>
            <p style={styles.eyebrow}>Your question</p>
            <p style={styles.question}>{request.question}</p>
            {request.link && (
              <a style={styles.link} href={request.link} target="_blank" rel="noreferrer">
                {request.link}
              </a>
            )}

            {request.status === "ANSWERED" ? (
              <div style={styles.answerBlock}>
                <p style={styles.eyebrow}>Reply</p>
                {request.responseText && <p style={styles.answerText}>{request.responseText}</p>}
                {request.responseLink && (
                  <div style={styles.mediaWrap}>
                    {request.responseSourceType === "UPLOAD" ? (
                      request.responseLink.endsWith(".mp4") ? (
                        <video style={styles.media} src={request.responsePlayUrl} controls />
                      ) : (
                        <audio style={styles.media} src={request.responsePlayUrl} controls />
                      )
                    ) : (
                      <a style={styles.link} href={request.responseLink} target="_blank" rel="noreferrer">
                        {request.responseLink}
                      </a>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div style={styles.waitBlock}>
                <div style={styles.pulse} aria-hidden="true" />
                <p style={styles.waitText}>No reply yet — check back later. This page updates on its own.</p>
              </div>
            )}
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
    maxWidth: 480,
    background: "var(--panel)",
    border: "1px solid var(--line-soft)",
    boxShadow: "var(--shadow-md)",
    borderRadius: 12,
    padding: "32px 28px",
  },
  title: {
    fontFamily: "var(--font-head)",
    fontWeight: 800,
    fontSize: "1.4rem",
    margin: "0 0 8px",
  },
  sub: {
    color: "var(--text-dim)",
    fontSize: "0.9rem",
    margin: 0,
  },
  eyebrow: {
    fontSize: "0.75rem",
    color: "var(--text-dim)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    margin: "0 0 6px",
  },
  question: {
    fontSize: "1rem",
    margin: "0 0 8px",
    lineHeight: 1.5,
  },
  link: {
    fontSize: "0.85rem",
    color: "var(--cyan)",
    wordBreak: "break-all",
  },
  answerBlock: {
    marginTop: 24,
    paddingTop: 20,
    borderTop: "1px solid var(--line)",
  },
  answerText: {
    fontSize: "0.98rem",
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
  },
  mediaWrap: {
    marginTop: 10,
  },
  media: {
    width: "100%",
    maxHeight: 240,
  },
  waitBlock: {
    marginTop: 24,
    paddingTop: 20,
    borderTop: "1px solid var(--line)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  pulse: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "var(--gradient)",
    marginBottom: 12,
    boxShadow: "var(--glow-cyan)",
  },
  waitText: {
    color: "var(--text-dim)",
    fontSize: "0.88rem",
    margin: 0,
  },
};
