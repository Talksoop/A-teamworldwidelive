import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

function formatPrice(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function Submit() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [link, setLink] = useState("");
  const [message, setMessage] = useState("");
  const [settings, setSettings] = useState(null);
  const [skipOffers, setSkipOffers] = useState([]);
  const [reactOffers, setReactOffers] = useState([]);
  const [skipOfferId, setSkipOfferId] = useState("");
  const [reactOfferId, setReactOfferId] = useState("");
  const [state, setState] = useState("idle"); // idle | sending | done | error
  const [error, setError] = useState("");

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

    if (router.query.canceled) {
      setError("Checkout was canceled — nothing was charged.");
    }
  }, [router.query.canceled]);

  const basePrice = settings?.submissionMode === "PAID" ? settings.basePriceCents : 0;
  const skipPrice = skipOffers.find((o) => o.id === skipOfferId)?.priceCents || 0;
  const reactPrice = reactOffers.find((o) => o.id === reactOfferId)?.priceCents || 0;
  const total = basePrice + skipPrice + reactPrice;

  async function handleSubmit(e) {
    e.preventDefault();
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          link,
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
        setLink("");
        setMessage("");
        setSkipOfferId("");
        setReactOfferId("");
      } else {
        window.location.href = data.url;
      }
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
    fontSize: "1.6rem",
    margin: "0 0 8px",
  },
  doneSub: {
    color: "var(--text-dim)",
    fontSize: "0.92rem",
    margin: "0 0 20px",
  },
};
