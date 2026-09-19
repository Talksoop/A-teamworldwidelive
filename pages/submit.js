import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

function formatPrice(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function Submit() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [songName, setSongName] = useState("");
  const [link, setLink] = useState("");
  const [message, setMessage] = useState("");
  const [sourceMode, setSourceMode] = useState("link"); // link | upload
  const [uploadKey, setUploadKey] = useState("");
  const [uploadFileName, setUploadFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [settings, setSettings] = useState(null);
  const [skipOffers, setSkipOffers] = useState([]);
  const [reactOffers, setReactOffers] = useState([]);
  const [skipOfferId, setSkipOfferId] = useState("");
  const [reactOfferId, setReactOfferId] = useState("");
  const [state, setState] = useState("idle"); // idle | sending | done | error | checking-payment | bonus | complete
  const [error, setError] = useState("");
  const [parentId, setParentId] = useState(null);
  const pollTries = useRef(0);

  useEffect(() => {
    async function load() {
      const [settingsRes, offersRes] = await Promise.all([
        fetch("/api/settings"),
        fetch("/api/offers"),
      ]);
      setSettings(await settingsRes.json());
      const offers = await offersRes.json();
      setSkipOffers(offers.filter((o) => o.type === "SKIP"));
      setReactOffers(offers.filter((o) => o.type === "REACT"));
    }
    load();
  }, []);

  // Returning from Stripe: poll until the webhook has confirmed payment, then
  // either prompt for a bonus song or wrap up.
  useEffect(() => {
    if (!router.isReady) return;
    if (router.query.canceled) {
      setError("Checkout was canceled — nothing was charged.");
      return;
    }
    if (router.query.paid && router.query.submission) {
      setState("checking-payment");
      setParentId(router.query.submission);
      pollTries.current = 0;
      const poll = async () => {
        pollTries.current += 1;
        try {
          const res = await fetch(`/api/submissions/${router.query.submission}/status`);
          const data = await res.json();
          if (data.paid) {
            if (data.bonusRemaining > 0) {
              setState("bonus");
            } else {
              setState("complete");
            }
            return;
          }
        } catch {
          // keep polling
        }
        if (pollTries.current < 15) {
          setTimeout(poll, 1500);
        } else {
          setState("complete"); // payment likely still processing; don't block them forever
        }
      };
      poll();
    }
  }, [router.isReady, router.query.paid, router.query.submission, router.query.canceled]);

  const basePrice = settings?.submissionMode === "PAID" ? settings.basePriceCents : 0;
  const skipPrice = skipOffers.find((o) => o.id === skipOfferId)?.priceCents || 0;
  const reactPrice = reactOffers.find((o) => o.id === reactOfferId)?.priceCents || 0;
  const total = basePrice + skipPrice + reactPrice;

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError("");
    setUploadKey("");
    setUploadFileName(file.name);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed.");
      setUploadKey(data.key);
    } catch (err) {
      setUploadError(err.message);
      setUploadFileName("");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (sourceMode === "upload" && !uploadKey) {
      setError(uploading ? "Still uploading — wait a moment." : "Choose a file first.");
      return;
    }
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          songName,
          link: sourceMode === "upload" ? uploadKey : link,
          sourceType: sourceMode === "upload" ? "UPLOAD" : "LINK",
          message,
          skipOfferId: skipOfferId || undefined,
          reactOfferId: reactOfferId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Couldn't submit that. Try again.");
      }
      if (data.free) {
        setState("done");
        setName("");
        setSongName("");
        setLink("");
        setMessage("");
        setSkipOfferId("");
        setReactOfferId("");
        setUploadKey("");
        setUploadFileName("");
      } else {
        window.location.href = data.url;
      }
    } catch (err) {
      setState("error");
      setError(err.message);
    }
  }

  async function handleBonusSubmit(e) {
    e.preventDefault();
    if (sourceMode === "upload" && !uploadKey) {
      setError(uploading ? "Still uploading — wait a moment." : "Choose a file first.");
      return;
    }
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/submissions/bonus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId,
          name,
          songName,
          link: sourceMode === "upload" ? uploadKey : link,
          sourceType: sourceMode === "upload" ? "UPLOAD" : "LINK",
          message,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Couldn't submit that. Try again.");
      }
      setState("complete");
    } catch (err) {
      setState("error");
      setError(err.message);
    }
  }

  if (state === "checking-payment") {
    return (
      <main style={styles.main}>
        <div style={styles.card}>
          <div style={styles.pulse} aria-hidden="true" />
          <h1 style={styles.doneTitle}>Confirming your payment…</h1>
          <p style={styles.doneSub}>This only takes a second.</p>
        </div>
      </main>
    );
  }

  if (state === "bonus") {
    return (
      <main style={styles.main}>
        <form style={styles.card} onSubmit={handleBonusSubmit}>
          <h1 style={styles.title}>Song paid for — add your second song</h1>
          <p style={styles.sub}>
            This one's already covered. It gets the same skip as your first pick.
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
            Song name
            <input
              style={styles.input}
              value={songName}
              onChange={(e) => setSongName(e.target.value)}
              maxLength={100}
              required
              placeholder="Track title"
            />
          </label>
          <div style={styles.sourceToggle}>
            <button
              type="button"
              style={sourceMode === "link" ? styles.sourceBtnActive : styles.sourceBtn}
              onClick={() => setSourceMode("link")}
            >
              Paste a link
            </button>
            <button
              type="button"
              style={sourceMode === "upload" ? styles.sourceBtnActive : styles.sourceBtn}
              onClick={() => setSourceMode("upload")}
            >
              Upload a file
            </button>
          </div>
          {sourceMode === "link" ? (
            <label style={styles.label}>
              Link
              <input
                style={styles.input}
                value={link}
                onChange={(e) => setLink(e.target.value)}
                type="url"
                maxLength={500}
                required={sourceMode === "link"}
                placeholder="https://open.spotify.com/track/..."
              />
            </label>
          ) : (
            <label style={styles.label}>
              File (MP3, WAV, or MP4 — max 50MB)
              <input
                style={styles.input}
                type="file"
                accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,video/mp4"
                onChange={handleFileChange}
              />
              {uploading && <span style={styles.uploadStatus}>Uploading…</span>}
              {!uploading && uploadKey && (
                <span style={styles.uploadStatus}>✓ {uploadFileName} uploaded</span>
              )}
              {uploadError && <span style={styles.error}>{uploadError}</span>}
            </label>
          )}
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
          <button style={styles.primaryBtn} type="submit">
            Submit second song
          </button>
        </form>
      </main>
    );
  }

  if (state === "complete" || state === "done") {
    return (
      <main style={styles.main}>
        <div style={styles.card}>
          <div style={styles.pulse} aria-hidden="true" />
          <h1 style={styles.doneTitle}>You're in the queue</h1>
          <p style={styles.doneSub}>Keep an eye on the stream — it'll play when it's up.</p>
          <button
            style={styles.secondaryBtn}
            onClick={() => {
              setState("idle");
              setName("");
              setSongName("");
              setLink("");
              setMessage("");
              router.replace("/submit", undefined, { shallow: true });
            }}
          >
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
          <p style={styles.sub}>
            {basePrice > 0
              ? `${formatPrice(basePrice)} to enter the queue. Add a skip or react offer below.`
              : "Paste a link. It goes straight into the review queue."}
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
            Song name
            <input
              style={styles.input}
              value={songName}
              onChange={(e) => setSongName(e.target.value)}
              maxLength={100}
              required
              placeholder="Track title"
            />
          </label>

          <div style={styles.sourceToggle}>
            <button
              type="button"
              style={sourceMode === "link" ? styles.sourceBtnActive : styles.sourceBtn}
              onClick={() => setSourceMode("link")}
            >
              Paste a link
            </button>
            <button
              type="button"
              style={sourceMode === "upload" ? styles.sourceBtnActive : styles.sourceBtn}
              onClick={() => setSourceMode("upload")}
            >
              Upload a file
            </button>
          </div>

          {sourceMode === "link" ? (
            <label style={styles.label}>
              Link
              <input
                style={styles.input}
                value={link}
                onChange={(e) => setLink(e.target.value)}
                type="url"
                maxLength={500}
                required={sourceMode === "link"}
                placeholder="https://open.spotify.com/track/..."
              />
            </label>
          ) : (
            <label style={styles.label}>
              File (MP3, WAV, or MP4 — max 50MB)
              <input
                style={styles.input}
                type="file"
                accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,video/mp4"
                onChange={handleFileChange}
              />
              {uploading && <span style={styles.uploadStatus}>Uploading…</span>}
              {!uploading && uploadKey && (
                <span style={styles.uploadStatus}>✓ {uploadFileName} uploaded</span>
              )}
              {uploadError && <span style={styles.error}>{uploadError}</span>}
            </label>
          )}

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

          {skipOffers.length > 0 && (
            <div style={styles.offerGroup}>
              <p style={styles.offerLabel}>Skip the line</p>
              <div style={styles.offerOption} onClick={() => setSkipOfferId("")}>
                <input type="radio" checked={skipOfferId === ""} onChange={() => setSkipOfferId("")} />
                <span style={styles.offerName}>No skip — regular queue</span>
              </div>
              {skipOffers.map((o) => (
                <div key={o.id} style={styles.offerOption} onClick={() => setSkipOfferId(o.id)}>
                  <input
                    type="radio"
                    checked={skipOfferId === o.id}
                    onChange={() => setSkipOfferId(o.id)}
                  />
                  <span style={styles.offerName}>{o.name}</span>
                  {o.description && <span style={styles.offerDesc}>{o.description}</span>}
                  {o.bonusSubmissions > 0 && (
                    <span style={styles.offerDesc}>
                      + submit {o.bonusSubmissions} more song{o.bonusSubmissions > 1 ? "s" : ""}{" "}
                      free, same skip
                    </span>
                  )}
                  <span style={styles.offerPrice}>{formatPrice(o.priceCents)}</span>
                </div>
              ))}
            </div>
          )}

          {reactOffers.length > 0 && (
            <div style={styles.offerGroup}>
              <p style={styles.offerLabel}>Special reaction</p>
              <div style={styles.offerOption} onClick={() => setReactOfferId("")}>
                <input
                  type="radio"
                  checked={reactOfferId === ""}
                  onChange={() => setReactOfferId("")}
                />
                <span style={styles.offerName}>None</span>
              </div>
              {reactOffers.map((o) => (
                <div key={o.id} style={styles.offerOption} onClick={() => setReactOfferId(o.id)}>
                  <input
                    type="radio"
                    checked={reactOfferId === o.id}
                    onChange={() => setReactOfferId(o.id)}
                  />
                  <span style={styles.offerName}>{o.name}</span>
                  {o.description && <span style={styles.offerDesc}>{o.description}</span>}
                  <span style={styles.offerPrice}>{formatPrice(o.priceCents)}</span>
                </div>
              ))}
            </div>
          )}

          {total > 0 && (
            <div style={styles.total}>
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          )}

          {error && <p style={styles.error}>{error}</p>}

          <button style={styles.primaryBtn} type="submit" disabled={state === "sending"}>
            {state === "sending" ? "Sending…" : total > 0 ? `Pay ${formatPrice(total)} & submit` : "Send it in"}
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
    maxWidth: 440,
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
  sourceToggle: {
    display: "flex",
    gap: 8,
    marginBottom: 16,
  },
  sourceBtn: {
    flex: 1,
    background: "var(--panel-raised)",
    border: "1px solid var(--line)",
    color: "var(--text-dim)",
    fontWeight: 600,
    padding: "9px 12px",
    borderRadius: 7,
    fontSize: "0.85rem",
  },
  sourceBtnActive: {
    flex: 1,
    background: "var(--gradient)",
    border: "1px solid transparent",
    color: "#05060e",
    fontWeight: 700,
    padding: "9px 12px",
    borderRadius: 7,
    fontSize: "0.85rem",
  },
  uploadStatus: {
    fontSize: "0.78rem",
    color: "var(--cyan)",
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
  offerGroup: {
    textAlign: "left",
    marginBottom: 16,
  },
  offerLabel: {
    fontSize: "0.85rem",
    color: "var(--text-dim)",
    margin: "0 0 8px",
  },
  offerOption: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    background: "var(--panel-raised)",
    border: "1px solid var(--line)",
    borderRadius: 8,
    padding: "10px 12px",
    marginBottom: 6,
    cursor: "pointer",
  },
  offerName: {
    fontSize: "0.9rem",
    flex: 1,
  },
  offerDesc: {
    fontSize: "0.78rem",
    color: "var(--text-dim)",
    flexBasis: "100%",
    marginLeft: 24,
  },
  offerPrice: {
    fontSize: "0.85rem",
    color: "var(--cyan)",
    fontWeight: 600,
  },
  total: {
    display: "flex",
    justifyContent: "space-between",
    fontWeight: 700,
    fontSize: "1rem",
    padding: "10px 2px",
    borderTop: "1px solid var(--line)",
    marginBottom: 16,
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
    boxShadow: "var(--glow-cyan)",
  },
  doneTitle: {
    fontFamily: "var(--font-head)",
    fontWeight: 800,
    fontSize: "1.5rem",
    margin: "0 0 8px",
  },
  doneSub: {
    color: "var(--text-dim)",
    fontSize: "0.92rem",
    margin: "0 0 20px",
  },
};
