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

function formatPrice(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function Admin() {
  const [tab, setTab] = useState("queue");
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
        <h1 style={styles.title}>Admin</h1>
        <div style={styles.tabs}>
          <button
            style={tab === "queue" ? styles.tabActive : styles.tab}
            onClick={() => setTab("queue")}
          >
            Queue
          </button>
          <button
            style={tab === "pricing" ? styles.tabActive : styles.tab}
            onClick={() => setTab("pricing")}
          >
            Pricing &amp; Offers
          </button>
        </div>
        {error && <p style={styles.error}>{error}</p>}

        {tab === "queue" ? (
          <>
            <section style={styles.section}>
              <p style={styles.sectionLabel}>Now playing</p>
              {playing ? (
                <div style={styles.playingCard}>
                  <div>
                    <p style={styles.name}>{playing.songName || "(no song name)"}</p>
                    <p style={styles.submitter}>{playing.name}</p>
                    <a style={styles.link} href={playing.playUrl || playing.link} target="_blank" rel="noreferrer">
                      {playing.sourceType === "UPLOAD" ? "▶ Play uploaded file" : playing.link}
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
                        <p style={styles.name}>
                          {s.songName || "(no song name)"}
                          {s.paid && <span style={styles.paidTag}>PAID</span>}
                          {s.parentSubmissionId && <span style={styles.bonusTag}>BONUS</span>}
                        </p>
                        <p style={styles.submitter}>{s.name}</p>
                        <a style={styles.link} href={s.playUrl || s.link} target="_blank" rel="noreferrer">
                          {s.sourceType === "UPLOAD" ? "▶ Play uploaded file" : s.link}
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
                        <p style={styles.name}>
                          {s.songName || "(no song name)"}
                          {s.paid && <span style={styles.paidTag}>PAID</span>}
                          {s.parentSubmissionId && <span style={styles.bonusTag}>BONUS</span>}
                        </p>
                        <p style={styles.submitter}>{s.name}</p>
                        <a style={styles.link} href={s.playUrl || s.link} target="_blank" rel="noreferrer">
                          {s.sourceType === "UPLOAD" ? "▶ Play uploaded file" : s.link}
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
          </>
        ) : (
          <PricingAndOffers />
        )}
      </main>
    </>
  );
}

function PricingAndOffers() {
  const [settings, setSettings] = useState(null);
  const [offers, setOffers] = useState([]);
  const [basePriceInput, setBasePriceInput] = useState("0");
  const [savingSettings, setSavingSettings] = useState(false);
  const [showSkipForm, setShowSkipForm] = useState(false);
  const [showReactForm, setShowReactForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [settingsRes, offersRes] = await Promise.all([
      fetch("/api/settings"),
      fetch("/api/offers?all=1"),
    ]);
    const s = await settingsRes.json();
    setSettings(s);
    setBasePriceInput((s.basePriceCents / 100).toFixed(2));
    setOffers(await offersRes.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setMode(mode) {
    setSavingSettings(true);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionMode: mode }),
    });
    setSavingSettings(false);
    load();
  }

  async function saveBasePrice() {
    const cents = Math.round(parseFloat(basePriceInput || "0") * 100);
    if (Number.isNaN(cents) || cents < 0) {
      setError("Enter a valid price.");
      return;
    }
    setSavingSettings(true);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ basePriceCents: cents }),
    });
    setSavingSettings(false);
    load();
  }

  async function toggleActive(offer) {
    await fetch(`/api/offers/${offer.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !offer.active }),
    });
    load();
  }

  async function deleteOffer(id) {
    await fetch(`/api/offers/${id}`, { method: "DELETE" });
    load();
  }

  async function createOffer(payload) {
    const res = await fetch("/api/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Couldn't save that offer.");
      return;
    }
    setShowSkipForm(false);
    setShowReactForm(false);
    load();
  }

  async function updateOffer(id, payload) {
    const res = await fetch(`/api/offers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Couldn't save that offer.");
      return;
    }
    setEditingId(null);
    load();
  }

  const skipOffers = offers.filter((o) => o.type === "SKIP");
  const reactOffers = offers.filter((o) => o.type === "REACT");

  if (!settings) return null;

  return (
    <div>
      <section style={styles.section}>
        <p style={styles.sectionLabel}>Base submission price</p>
        <div style={styles.modeToggle}>
          <button
            style={settings.submissionMode === "FREE" ? styles.modeBtnActive : styles.modeBtn}
            onClick={() => setMode("FREE")}
            disabled={savingSettings}
          >
            Free
          </button>
          <button
            style={settings.submissionMode === "PAID" ? styles.modeBtnActive : styles.modeBtn}
            onClick={() => setMode("PAID")}
            disabled={savingSettings}
          >
            Paid
          </button>
        </div>
        {settings.submissionMode === "PAID" && (
          <div style={styles.priceRow}>
            <span style={styles.dollarSign}>$</span>
            <input
              style={styles.priceInput}
              type="number"
              min="0"
              step="0.01"
              value={basePriceInput}
              onChange={(e) => setBasePriceInput(e.target.value)}
            />
            <button style={styles.saveBtn} onClick={saveBasePrice} disabled={savingSettings}>
              Save
            </button>
          </div>
        )}
      </section>

      {error && <p style={styles.error}>{error}</p>}

      <section style={styles.section}>
        <p style={styles.sectionLabel}>Skip offers</p>
        <button style={styles.addBtn} onClick={() => setShowSkipForm((v) => !v)}>
          + Add skip offer
        </button>
        {showSkipForm && (
          <OfferForm
            type="SKIP"
            onCancel={() => setShowSkipForm(false)}
            onSave={createOffer}
          />
        )}
        <OfferList
          offers={skipOffers}
          onToggle={toggleActive}
          onDelete={deleteOffer}
          showPriority
          editingId={editingId}
          onStartEdit={setEditingId}
          onCancelEdit={() => setEditingId(null)}
          onSaveEdit={updateOffer}
        />
      </section>

      <section style={styles.section}>
        <p style={styles.sectionLabel}>React offers</p>
        <button style={styles.addBtn} onClick={() => setShowReactForm((v) => !v)}>
          + Add react offer
        </button>
        {showReactForm && (
          <OfferForm
            type="REACT"
            onCancel={() => setShowReactForm(false)}
            onSave={createOffer}
          />
        )}
        <OfferList
          offers={reactOffers}
          onToggle={toggleActive}
          onDelete={deleteOffer}
          editingId={editingId}
          onStartEdit={setEditingId}
          onCancelEdit={() => setEditingId(null)}
          onSaveEdit={updateOffer}
        />
      </section>
    </div>
  );
}

function OfferForm({ type, initial, onCancel, onSave }) {
  const [name, setName] = useState(initial?.name || "");
  const [price, setPrice] = useState(initial ? (initial.priceCents / 100).toFixed(2) : "");
  const [priority, setPriority] = useState(String(initial?.priority ?? 1));
  const [bonusSubmissions, setBonusSubmissions] = useState(String(initial?.bonusSubmissions ?? 0));
  const [description, setDescription] = useState(initial?.description || "");

  function submit(e) {
    e.preventDefault();
    const cents = Math.round(parseFloat(price || "0") * 100);
    onSave({
      type,
      name,
      description: description || undefined,
      priceCents: cents,
      priority: type === "SKIP" ? parseInt(priority, 10) || 0 : undefined,
      bonusSubmissions: type === "SKIP" ? parseInt(bonusSubmissions, 10) || 0 : undefined,
    });
  }

  return (
    <form style={styles.offerForm} onSubmit={submit}>
      <input
        style={styles.input}
        placeholder="Name (e.g. Skip the line)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={80}
        required
      />
      <input
        style={styles.input}
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={200}
      />
      <div style={styles.formRow}>
        <input
          style={{ ...styles.input, flex: 1 }}
          type="number"
          min="0.01"
          step="0.01"
          placeholder="Price ($)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
        {type === "SKIP" && (
          <input
            style={{ ...styles.input, flex: 1 }}
            type="number"
            min="0"
            placeholder="Jump priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          />
        )}
      </div>
      {type === "SKIP" && (
        <div style={styles.formRow}>
          <input
            style={{ ...styles.input, flex: 1 }}
            type="number"
            min="0"
            placeholder="Bonus free songs"
            value={bonusSubmissions}
            onChange={(e) => setBonusSubmissions(e.target.value)}
          />
        </div>
      )}
      {type === "SKIP" && (
        <p style={styles.hint}>
          Higher priority jumps further toward the front of the queue. Bonus songs let the fan
          submit that many extra tracks for free after paying, all with the same jump.
        </p>
      )}
      <div style={styles.formRow}>
        <button style={styles.saveBtn} type="submit">
          {initial ? "Save changes" : "Save"}
        </button>
        <button style={styles.cancelBtn} type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function OfferList({
  offers,
  onToggle,
  onDelete,
  showPriority,
  editingId,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
}) {
  if (offers.length === 0) {
    return <p style={styles.empty}>No offers yet</p>;
  }
  return (
    <div style={styles.offerGrid}>
      {offers.map((o) =>
        editingId === o.id ? (
          <div key={o.id} style={styles.offerEditWrap}>
            <OfferForm
              type={o.type}
              initial={o}
              onCancel={onCancelEdit}
              onSave={(payload) => onSaveEdit(o.id, payload)}
            />
          </div>
        ) : (
          <div key={o.id} style={{ ...styles.offerCard, opacity: o.active ? 1 : 0.5 }}>
            <p style={styles.offerCardName}>{o.name}</p>
            <p style={styles.offerCardPrice}>{formatPrice(o.priceCents)}</p>
            {o.description && <p style={styles.offerCardDesc}>{o.description}</p>}
            {showPriority && <p style={styles.offerCardDesc}>Priority: {o.priority}</p>}
            {showPriority && o.bonusSubmissions > 0 && (
              <p style={styles.offerCardDesc}>+{o.bonusSubmissions} bonus song(s)</p>
            )}
            <div style={styles.offerCardBtns}>
              <button style={styles.smallBtn} onClick={() => onStartEdit(o.id)}>
                Edit
              </button>
              <button style={styles.smallBtn} onClick={() => onToggle(o)}>
                {o.active ? "Deactivate" : "Activate"}
              </button>
              <button style={styles.smallBtnDanger} onClick={() => onDelete(o.id)}>
                Delete
              </button>
            </div>
          </div>
        )
      )}
    </div>
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
    margin: "0 0 20px",
  },
  tabs: {
    display: "flex",
    gap: 8,
    marginBottom: 24,
    borderBottom: "1px solid var(--line)",
  },
  tab: {
    background: "transparent",
    border: "none",
    color: "var(--text-dim)",
    fontWeight: 600,
    fontSize: "0.9rem",
    padding: "10px 4px",
    borderBottom: "2px solid transparent",
  },
  tabActive: {
    background: "transparent",
    border: "none",
    color: "var(--cyan)",
    fontWeight: 600,
    fontSize: "0.9rem",
    padding: "10px 4px",
    borderBottom: "2px solid var(--cyan)",
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
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  paidTag: {
    fontSize: "0.65rem",
    fontWeight: 700,
    color: "#05060e",
    background: "var(--gradient)",
    padding: "2px 6px",
    borderRadius: 4,
    letterSpacing: "0.05em",
  },
  bonusTag: {
    fontSize: "0.65rem",
    fontWeight: 700,
    color: "var(--cyan)",
    border: "1px solid var(--cyan)",
    padding: "1px 6px",
    borderRadius: 4,
    letterSpacing: "0.05em",
  },
  submitter: {
    fontSize: "0.78rem",
    color: "var(--text-dim)",
    margin: "0 0 2px",
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
  modeToggle: {
    display: "flex",
    gap: 8,
    marginBottom: 12,
  },
  modeBtn: {
    background: "var(--panel)",
    border: "1px solid var(--line)",
    color: "var(--text-dim)",
    fontWeight: 600,
    padding: "8px 20px",
    borderRadius: 7,
    fontSize: "0.85rem",
  },
  modeBtnActive: {
    background: "var(--gradient)",
    border: "1px solid transparent",
    color: "#05060e",
    fontWeight: 700,
    padding: "8px 20px",
    borderRadius: 7,
    fontSize: "0.85rem",
  },
  priceRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  dollarSign: {
    color: "var(--text-dim)",
  },
  priceInput: {
    background: "var(--panel-raised)",
    border: "1px solid var(--line)",
    borderRadius: 7,
    padding: "8px 10px",
    color: "var(--text)",
    fontSize: "0.9rem",
    width: 100,
  },
  saveBtn: {
    background: "var(--gradient)",
    color: "#05060e",
    border: "none",
    fontWeight: 600,
    padding: "8px 16px",
    borderRadius: 7,
    fontSize: "0.85rem",
  },
  cancelBtn: {
    background: "transparent",
    border: "1px solid var(--line)",
    color: "var(--text-dim)",
    fontWeight: 500,
    padding: "8px 16px",
    borderRadius: 7,
    fontSize: "0.85rem",
  },
  addBtn: {
    background: "var(--panel-raised)",
    border: "1px solid var(--cyan)",
    color: "var(--cyan)",
    fontWeight: 600,
    padding: "10px 16px",
    borderRadius: 8,
    fontSize: "0.85rem",
    marginBottom: 12,
  },
  offerForm: {
    background: "var(--panel)",
    border: "1px solid var(--line)",
    borderRadius: 10,
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginBottom: 14,
  },
  input: {
    background: "var(--panel-raised)",
    border: "1px solid var(--line)",
    borderRadius: 7,
    padding: "9px 11px",
    color: "var(--text)",
    fontSize: "0.9rem",
    outline: "none",
  },
  formRow: {
    display: "flex",
    gap: 8,
  },
  hint: {
    fontSize: "0.78rem",
    color: "var(--text-dim)",
    margin: 0,
  },
  offerGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },
  offerEditWrap: {
    gridColumn: "1 / -1",
  },
  offerCard: {
    background: "var(--panel)",
    border: "1px solid var(--line)",
    borderRadius: 10,
    padding: 14,
  },
  offerCardName: {
    fontWeight: 600,
    fontSize: "0.9rem",
    margin: "0 0 4px",
  },
  offerCardPrice: {
    color: "var(--cyan)",
    fontWeight: 700,
    fontSize: "1rem",
    margin: "0 0 4px",
  },
  offerCardDesc: {
    color: "var(--text-dim)",
    fontSize: "0.78rem",
    margin: "0 0 8px",
  },
  offerCardBtns: {
    display: "flex",
    gap: 6,
  },
  smallBtn: {
    background: "transparent",
    border: "1px solid var(--line)",
    color: "var(--text-dim)",
    fontSize: "0.75rem",
    padding: "5px 8px",
    borderRadius: 6,
    flex: 1,
  },
  smallBtnDanger: {
    background: "transparent",
    border: "1px solid var(--live)",
    color: "var(--live)",
    fontSize: "0.75rem",
    padding: "5px 8px",
    borderRadius: 6,
    flex: 1,
  },
};
