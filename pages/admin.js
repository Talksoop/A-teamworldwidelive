import { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import { getSessionHostId } from "../lib/auth";
import { useQueueSocket } from "../lib/useQueueSocket";
import { parseLink, PLATFORM_LABELS } from "../lib/linkParse";

export async function getServerSideProps({ req }) {
  if (!getSessionHostId(req)) {
    return { redirect: { destination: "/login", permanent: false } };
  }
  return { props: {} };
}

function formatPrice(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

function PlatformBadge({ link }) {
  const { platform } = parseLink(link);
  if (platform === "link") return null;
  return <span style={styles.platformBadge}>{PLATFORM_LABELS[platform]}</span>;
}

export default function Admin() {
  const [tab, setTab] = useState("queue");
  const [submissions, setSubmissions] = useState([]);
  const [error, setError] = useState("");
  const [dragId, setDragId] = useState(null);
  const [me, setMe] = useState(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then(setMe);
  }, []);

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
  }, [load]);

  useQueueSocket(me?.id, load);

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

  function handleDrop(targetId) {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      return;
    }
    const ids = queued.map((s) => s.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    ids.splice(from, 1);
    ids.splice(to, 0, dragId);
    setDragId(null);

    // Optimistic local reorder so it feels instant, then persist.
    setSubmissions((prev) => {
      const byId = Object.fromEntries(prev.map((s) => [s.id, s]));
      const reordered = ids.map((id, index) => ({ ...byId[id], order: index }));
      const others = prev.filter((s) => s.status !== "QUEUED");
      return [...others, ...reordered];
    });

    fetch("/api/submissions/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: ids }),
    }).then((res) => {
      if (!res.ok) {
        setError("Reorder didn't save. Refreshing.");
        load();
      }
    });
  }

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
          <button
            style={tab === "battles" ? styles.tabActive : styles.tab}
            onClick={() => setTab("battles")}
          >
            Battles
          </button>
          <button
            style={tab === "ama" ? styles.tabActive : styles.tab}
            onClick={() => setTab("ama")}
          >
            AMA Inbox
          </button>
          <button
            style={tab === "channel" ? styles.tabActive : styles.tab}
            onClick={() => setTab("channel")}
          >
            Channel
          </button>
          {me?.isFounder && (
            <button
              style={tab === "platform" ? styles.tabActive : styles.tab}
              onClick={() => setTab("platform")}
            >
              Platform
            </button>
          )}
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
                      {playing.sourceType !== "UPLOAD" && <PlatformBadge link={playing.link} />}
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
              {queued.length > 1 && <p style={styles.dragHint}>Drag ⠿ to reorder</p>}
              {queued.length === 0 ? (
                <p style={styles.empty}>Queue is empty</p>
              ) : (
                <ul style={styles.list}>
                  {queued.map((s) => (
                    <li
                      key={s.id}
                      style={{
                        ...styles.row,
                        ...(dragId === s.id ? styles.rowDragging : {}),
                      }}
                      draggable
                      onDragStart={() => setDragId(s.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDrop(s.id)}
                    >
                      <span style={styles.dragHandle} aria-hidden="true">
                        ⠿
                      </span>
                      <div>
                        <p style={styles.name}>
                          {s.songName || "(no song name)"}
                          {s.paid && <span style={styles.paidTag}>PAID</span>}
                          {s.parentSubmissionId && <span style={styles.bonusTag}>BONUS</span>}
                        </p>
                        <p style={styles.submitter}>{s.name}</p>
                        <a style={styles.link} href={s.playUrl || s.link} target="_blank" rel="noreferrer">
                          {s.sourceType !== "UPLOAD" && <PlatformBadge link={s.link} />}
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
                          {s.sourceType !== "UPLOAD" && <PlatformBadge link={s.link} />}
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
        ) : tab === "pricing" ? (
          <PricingAndOffers />
        ) : tab === "battles" ? (
          <Battles submissions={submissions} hostId={me?.id} />
        ) : tab === "ama" ? (
          <AmaInbox />
        ) : tab === "channel" ? (
          <Channel me={me} />
        ) : (
          <Platform />
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

function Battles({ submissions, hostId }) {
  const [battles, setBattles] = useState([]);
  const [songAId, setSongAId] = useState("");
  const [songBId, setSongBId] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/battles");
    if (res.ok) setBattles(await res.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useQueueSocket(hostId, load, "battle-updated");

  const candidates = submissions.filter((s) =>
    ["PENDING", "QUEUED", "PLAYING"].includes(s.status)
  );

  async function createBattle(e) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/battles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ songAId, songBId }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Couldn't create that battle.");
      return;
    }
    setSongAId("");
    setSongBId("");
    load();
  }

  async function setStatus(id, status) {
    await fetch(`/api/battles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function deleteBattle(id) {
    await fetch(`/api/battles/${id}`, { method: "DELETE" });
    load();
  }

  const live = battles.filter((b) => b.status === "LIVE");
  const scheduled = battles.filter((b) => b.status === "SCHEDULED");
  const done = battles.filter((b) => b.status === "DONE");

  return (
    <div>
      <section style={styles.section}>
        <p style={styles.sectionLabel}>New battle</p>
        <form style={styles.offerForm} onSubmit={createBattle}>
          <select
            style={styles.input}
            value={songAId}
            onChange={(e) => setSongAId(e.target.value)}
            required
          >
            <option value="">Song A…</option>
            {candidates.map((s) => (
              <option key={s.id} value={s.id}>
                {s.songName || "(untitled)"} — {s.name}
              </option>
            ))}
          </select>
          <select
            style={styles.input}
            value={songBId}
            onChange={(e) => setSongBId(e.target.value)}
            required
          >
            <option value="">Song B…</option>
            {candidates.map((s) => (
              <option key={s.id} value={s.id}>
                {s.songName || "(untitled)"} — {s.name}
              </option>
            ))}
          </select>
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.saveBtn} type="submit">
            Create battle
          </button>
        </form>
      </section>

      <BattleGroup
        title="Live"
        battles={live}
        onEnd={(id) => setStatus(id, "DONE")}
        onDelete={deleteBattle}
      />
      <BattleGroup
        title="Scheduled"
        battles={scheduled}
        onStart={(id) => setStatus(id, "LIVE")}
        onDelete={deleteBattle}
      />
      <BattleGroup title="Past" battles={done} onDelete={deleteBattle} past />
    </div>
  );
}

function BattleGroup({ title, battles, onStart, onEnd, onDelete, past }) {
  return (
    <section style={styles.section}>
      <p style={styles.sectionLabel}>
        {title} ({battles.length})
      </p>
      {battles.length === 0 ? (
        <p style={styles.empty}>Nothing here</p>
      ) : (
        <ul style={styles.list}>
          {battles.map((b) => (
            <li key={b.id} style={styles.row}>
              <div>
                <p style={styles.name}>
                  {b.songA?.songName || "?"} <span style={styles.vsInline}>vs</span>{" "}
                  {b.songB?.songName || "?"}
                </p>
                <p style={styles.submitter}>
                  {b.votesA} – {b.votesB} votes
                  {past && b.winnerSide && (
                    <> · winner: {b.winnerSide === "A" ? b.songA?.songName : b.songB?.songName}</>
                  )}
                </p>
              </div>
              <div style={styles.rowBtns}>
                {onStart && (
                  <button style={styles.playBtn} onClick={() => onStart(b.id)}>
                    Start
                  </button>
                )}
                {onEnd && (
                  <button style={styles.doneBtn} onClick={() => onEnd(b.id)}>
                    End
                  </button>
                )}
                <button style={styles.smallBtnDanger} onClick={() => onDelete(b.id)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AmaInbox() {
  const [settings, setSettings] = useState(null);
  const [priceInput, setPriceInput] = useState("10.00");
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [settingsRes, requestsRes] = await Promise.all([
      fetch("/api/ama-settings"),
      fetch("/api/ama"),
    ]);
    const s = await settingsRes.json();
    setSettings(s);
    setPriceInput((s.amaPriceCents / 100).toFixed(2));
    if (requestsRes.ok) setRequests(await requestsRes.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleEnabled() {
    await fetch("/api/ama-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amaEnabled: !settings.amaEnabled }),
    });
    load();
  }

  async function savePrice() {
    const cents = Math.round(parseFloat(priceInput || "0") * 100);
    if (Number.isNaN(cents) || cents < 0) {
      setError("Enter a valid price.");
      return;
    }
    await fetch("/api/ama-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amaPriceCents: cents }),
    });
    load();
  }

  const pending = requests.filter((r) => r.status === "PENDING");
  const answered = requests.filter((r) => r.status === "ANSWERED");

  if (!settings) return null;

  return (
    <div>
      <section style={styles.section}>
        <p style={styles.sectionLabel}>Accepting requests</p>
        <div style={styles.modeToggle}>
          <button
            style={!settings.amaEnabled ? styles.modeBtnActive : styles.modeBtn}
            onClick={() => !settings.amaEnabled || toggleEnabled()}
          >
            Off
          </button>
          <button
            style={settings.amaEnabled ? styles.modeBtnActive : styles.modeBtn}
            onClick={() => settings.amaEnabled || toggleEnabled()}
          >
            On
          </button>
        </div>
        <div style={styles.priceRow}>
          <span style={styles.dollarSign}>$</span>
          <input
            style={styles.priceInput}
            type="number"
            min="0"
            step="0.01"
            value={priceInput}
            onChange={(e) => setPriceInput(e.target.value)}
          />
          <button style={styles.saveBtn} onClick={savePrice}>
            Save
          </button>
        </div>
        {error && <p style={styles.error}>{error}</p>}
      </section>

      <section style={styles.section}>
        <p style={styles.sectionLabel}>Pending ({pending.length})</p>
        {pending.length === 0 ? (
          <p style={styles.empty}>Nothing waiting on you</p>
        ) : (
          pending.map((r) => <AmaCard key={r.id} request={r} onReplied={load} />)
        )}
      </section>

      <section style={styles.section}>
        <p style={styles.sectionLabel}>Answered ({answered.length})</p>
        {answered.length === 0 ? (
          <p style={styles.empty}>None yet</p>
        ) : (
          answered.map((r) => <AmaCard key={r.id} request={r} answered />)
        )}
      </section>
    </div>
  );
}

function AmaCard({ request, onReplied, answered }) {
  const [replying, setReplying] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [mode, setMode] = useState("text"); // text | link | upload
  const [responseLink, setResponseLink] = useState("");
  const [uploadKey, setUploadKey] = useState("");
  const [uploadName, setUploadName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed.");
      setUploadKey(data.key);
      setUploadName(file.name);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function submitReply() {
    setError("");
    const payload = { responseText: responseText || undefined };
    if (mode === "link" && responseLink) {
      payload.responseLink = responseLink;
      payload.responseSourceType = "LINK";
    } else if (mode === "upload" && uploadKey) {
      payload.responseLink = uploadKey;
      payload.responseSourceType = "UPLOAD";
    }
    const res = await fetch(`/api/ama/${request.id}/reply`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Couldn't send that reply.");
      return;
    }
    onReplied();
  }

  return (
    <div style={styles.row}>
      <div style={{ flex: 1 }}>
        <p style={styles.name}>{request.name}</p>
        <p style={styles.msg}>{request.question}</p>
        {request.link && (
          <a style={styles.link} href={request.link} target="_blank" rel="noreferrer">
            {request.link}
          </a>
        )}

        {answered && (
          <div style={{ marginTop: 10 }}>
            <p style={styles.submitter}>Your reply:</p>
            {request.responseText && <p style={styles.msg}>{request.responseText}</p>}
            {request.responseLink && (
              <p style={styles.submitter}>
                {request.responseSourceType === "UPLOAD" ? "Uploaded file attached" : request.responseLink}
              </p>
            )}
          </div>
        )}

        {!answered && !replying && (
          <button style={{ ...styles.playBtn, marginTop: 10 }} onClick={() => setReplying(true)}>
            Reply
          </button>
        )}

        {!answered && replying && (
          <div style={{ marginTop: 12 }}>
            <textarea
              style={{ ...styles.input, width: "100%", height: 80, resize: "vertical" }}
              placeholder="Write your reply…"
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
            />
            <div style={{ ...styles.formRow, marginTop: 8 }}>
              <button
                style={mode === "link" ? styles.modeBtnActive : styles.modeBtn}
                onClick={() => setMode("link")}
                type="button"
              >
                + Link
              </button>
              <button
                style={mode === "upload" ? styles.modeBtnActive : styles.modeBtn}
                onClick={() => setMode("upload")}
                type="button"
              >
                + Upload
              </button>
            </div>
            {mode === "link" && (
              <input
                style={{ ...styles.input, width: "100%", marginTop: 8 }}
                placeholder="https://..."
                value={responseLink}
                onChange={(e) => setResponseLink(e.target.value)}
              />
            )}
            {mode === "upload" && (
              <div style={{ marginTop: 8 }}>
                <input type="file" accept="audio/mpeg,audio/wav,video/mp4" onChange={handleFile} />
                {uploading && <p style={styles.submitter}>Uploading…</p>}
                {!uploading && uploadKey && <p style={styles.submitter}>✓ {uploadName} uploaded</p>}
              </div>
            )}
            {error && <p style={styles.error}>{error}</p>}
            <div style={{ ...styles.formRow, marginTop: 10 }}>
              <button style={styles.saveBtn} onClick={submitReply}>
                Send reply
              </button>
              <button style={styles.cancelBtn} onClick={() => setReplying(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Channel({ me }) {
  const [connecting, setConnecting] = useState(false);
  const [checked, setChecked] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("stripe_return") && !checked) {
      setChecked(true);
      fetch("/api/stripe/connect-status", { method: "POST" });
    }
  }, [checked]);

  async function connectStripe() {
    setConnecting(true);
    const res = await fetch("/api/stripe/connect", { method: "POST" });
    const data = await res.json();
    setConnecting(false);
    if (data.url) window.location.href = data.url;
  }

  async function changePassword(e) {
    e.preventDefault();
    setPwError("");
    setPwSuccess(false);
    setPwSaving(true);
    const res = await fetch("/api/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json().catch(() => ({}));
    setPwSaving(false);
    if (!res.ok) {
      setPwError(data.error || "Couldn't change your password.");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setPwSuccess(true);
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function deleteAccount() {
    setDeleting(true);
    setDeleteError("");
    const res = await fetch("/api/account", { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setDeleteError(d.error || "Couldn't delete your account.");
      setDeleting(false);
      return;
    }
    window.location.href = "/";
  }

  if (!me) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div>
      <section style={styles.section}>
        <p style={styles.sectionLabel}>Your public pages</p>
        <div style={styles.linkList}>
          <a style={styles.linkRow} href={`/h/${me.slug}/submit`} target="_blank" rel="noreferrer">
            {origin}/h/{me.slug}/submit
          </a>
          <a style={styles.linkRow} href={`/h/${me.slug}/overlay`} target="_blank" rel="noreferrer">
            {origin}/h/{me.slug}/overlay
          </a>
          <a style={styles.linkRow} href={`/h/${me.slug}/vote`} target="_blank" rel="noreferrer">
            {origin}/h/{me.slug}/vote
          </a>
          <a style={styles.linkRow} href={`/h/${me.slug}/ama`} target="_blank" rel="noreferrer">
            {origin}/h/{me.slug}/ama
          </a>
        </div>
      </section>

      <section style={styles.section}>
        <p style={styles.sectionLabel}>Payments</p>
        {me.isFounder ? (
          <p style={styles.empty}>
            You're the platform owner — payments go straight to your own Stripe account, no setup needed.
          </p>
        ) : me.stripeOnboarded ? (
          <p style={styles.empty}>
            ✓ Stripe connected. The platform takes {(me.platformFeeBps / 100).toFixed(0)}% per paid
            transaction; the rest is paid out to you automatically by Stripe.
          </p>
        ) : (
          <>
            <p style={styles.empty}>
              Connect Stripe to accept paid submissions, skip tiers, and AMA requests. Platform fee:{" "}
              {(me.platformFeeBps / 100).toFixed(0)}%.
            </p>
            <button style={styles.saveBtn} onClick={connectStripe} disabled={connecting}>
              {connecting ? "Redirecting…" : "Connect Stripe"}
            </button>
          </>
        )}
      </section>

      <section style={styles.section}>
        <p style={styles.sectionLabel}>Change password</p>
        <form style={styles.offerForm} onSubmit={changePassword}>
          <input
            style={styles.input}
            type="password"
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="New password (min 8 characters)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          {pwError && <p style={styles.error}>{pwError}</p>}
          {pwSuccess && <p style={{ ...styles.empty, color: "var(--cyan)" }}>Password updated.</p>}
          <button style={styles.saveBtn} type="submit" disabled={pwSaving}>
            {pwSaving ? "Saving…" : "Update password"}
          </button>
        </form>
      </section>

      <section style={styles.section}>
        <button style={styles.cancelBtn} onClick={logout}>
          Log out
        </button>
      </section>

      {!me.isFounder && (
        <section style={styles.section}>
          <p style={{ ...styles.sectionLabel, color: "var(--live)" }}>Danger zone</p>
          <p style={styles.empty}>
            Deletes your account and everything in it — submissions, offers, battles, AMA
            requests. This can't be undone.
          </p>
          <input
            style={{ ...styles.input, marginBottom: 10 }}
            placeholder='Type "delete" to confirm'
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
          />
          {deleteError && <p style={styles.error}>{deleteError}</p>}
          <button
            style={styles.smallBtnDanger}
            onClick={deleteAccount}
            disabled={deleteConfirm.toLowerCase() !== "delete" || deleting}
          >
            {deleting ? "Deleting…" : "Delete my account"}
          </button>
        </section>
      )}
    </div>
  );
}

function Platform() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/platform/hosts")
      .then(async (r) => {
        if (!r.ok) {
          const d = await r.json().catch(() => ({}));
          throw new Error(d.error || "Couldn't load.");
        }
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p style={styles.error}>{error}</p>;
  if (!data) return null;

  return (
    <div>
      <section style={styles.section}>
        <p style={styles.sectionLabel}>Platform totals</p>
        <div style={styles.playingCard}>
          <div>
            <p style={styles.name}>{data.totals.hostCount} host(s)</p>
            <p style={styles.submitter}>
              {formatPrice(data.totals.grossRevenueCents)} total processed
            </p>
          </div>
          <p style={{ ...styles.offerCardPrice, margin: 0 }}>
            {formatPrice(data.totals.platformFeeCents)}
          </p>
        </div>
        <p style={styles.hint}>Platform fee earned, all hosts combined.</p>
      </section>

      <section style={styles.section}>
        <p style={styles.sectionLabel}>Hosts</p>
        <ul style={styles.list}>
          {data.hosts.map((h) => (
            <li key={h.id} style={styles.row}>
              <div>
                <p style={styles.name}>
                  {h.name}
                  {h.isFounder && <span style={styles.paidTag}>YOU</span>}
                  {!h.isFounder && h.stripeOnboarded && (
                    <span style={styles.bonusTag}>STRIPE OK</span>
                  )}
                  {!h.isFounder && !h.stripeOnboarded && (
                    <span style={{ ...styles.bonusTag, color: "var(--live)", borderColor: "var(--live)" }}>
                      NOT ONBOARDED
                    </span>
                  )}
                </p>
                <p style={styles.submitter}>
                  {h.email} · /h/{h.slug}
                </p>
                <p style={styles.submitter}>
                  {h.submissionCount} submissions · {h.amaCount} AMA requests ·{" "}
                  {h.paidTransactionCount} paid
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={styles.offerCardPrice}>{formatPrice(h.grossRevenueCents)}</p>
                {!h.isFounder && (
                  <p style={styles.submitter}>+{formatPrice(h.platformFeeCents)} fee</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

const styles = {
  linkList: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  linkRow: {
    fontSize: "0.85rem",
    color: "var(--cyan)",
    wordBreak: "break-all",
  },
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
  rowDragging: {
    opacity: 0.4,
  },
  dragHandle: {
    color: "var(--text-dim)",
    cursor: "grab",
    fontSize: "1.1rem",
    userSelect: "none",
  },
  dragHint: {
    fontSize: "0.75rem",
    color: "var(--text-dim)",
    margin: "-6px 0 10px",
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
  platformBadge: {
    fontSize: "0.7rem",
    color: "var(--text-dim)",
    border: "1px solid var(--line)",
    borderRadius: 4,
    padding: "1px 6px",
    marginRight: 6,
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
  vsInline: {
    color: "var(--text-dim)",
    fontWeight: 500,
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
