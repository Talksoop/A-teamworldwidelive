import Head from "next/head";
import SiteFooter from "../lib/SiteFooter";

const LAST_UPDATED = "September 23, 2026";

export default function Privacy() {
  return (
    <>
      <Head>
        <title>Privacy Policy — A-Team Worldwide Live</title>
      </Head>
      <main style={styles.main}>
        <a href="/" style={styles.back}>
          ← A-Team Worldwide Live
        </a>
        <h1 style={styles.title}>Privacy Policy</h1>
        <p style={styles.updated}>Last updated: {LAST_UPDATED}</p>

        <div style={styles.notice}>
          This is a starting template, not legal advice. It hasn't been reviewed by a lawyer and
          doesn't account for the specific privacy laws that apply where you or your users are
          located. Have an attorney review and customize it before relying on it.
        </div>

        <Section title="1. What this covers">
          <P>
            This Privacy Policy explains what information A-Team Worldwide Live (the "Service")
            collects from Creators and Fans, how it's used, and who it's shared with. It's a
            companion to our{" "}
            <a style={styles.inlineLink} href="/terms">
              Terms of Service
            </a>
            , which governs your use of the Service more broadly.
          </P>
        </Section>

        <Section title="2. Information we collect">
          <P>
            <strong>Account info:</strong> your name, email address, and a securely hashed
            password — or, if you sign in with Google, the basic profile info Google shares with
            us (name, email, and a stable account ID) instead of a password.
          </P>
          <P>
            <strong>What you submit:</strong> song names, links, uploaded audio/video files,
            messages, AMA questions, and battle entries — whatever you send through the Service.
          </P>
          <P>
            <strong>Payment info:</strong> handled directly by Stripe. We never see or store your
            full card number — we only receive confirmation that a payment succeeded and how
            much it was for.
          </P>
          <P>
            <strong>Usage info:</strong> standard technical data any web app collects to run —
            things like IP address and browser type from server logs.
          </P>
        </Section>

        <Section title="3. How we use it">
          <P>
            To run the Service: manage your queue, process payments, show your content to the
            right people, and send you account-related emails (a submission confirmation, "your
            song is playing," a new AMA in your inbox, and similar).
          </P>
          <P>
            To keep the Service working and secure, and to communicate with you about your
            account when needed.
          </P>
        </Section>

        <Section title="4. Who we share it with">
          <P>
            <strong>Stripe</strong> — processes all payments and payouts. <strong>Our storage
            provider</strong> — hosts uploaded audio/video files. <strong>Google</strong> — only
            if you choose to sign in with Google. <strong>Connect Diva Media</strong> — only when
            a Creator recommends your submission for radio consideration; your name, email, and
            song info are shared so they can invite you to submit directly (see our Terms for
            details). We don't sell your information, and we don't share it with advertisers.
          </P>
        </Section>

        <Section title="5. Cookies & sessions">
          <P>
            We use a session cookie to keep you signed in as a Fan and, separately, as a Creator
            — that's it. We don't use third-party advertising or tracking cookies.
          </P>
        </Section>

        <Section title="6. Your choices">
          <P>
            You can update your account info anytime, and delete your account entirely — Creators
            from Admin → Channel, Fans from their account page. Deleting one account never
            deletes the other if you hold both.
          </P>
        </Section>

        <Section title="7. How long we keep it">
          <P>
            We keep your info while your account is active. After you delete your account, we
            remove what's reasonably tied to it; some records — like payment history we're
            required to keep, or a Creator's own copy of a submission made to their channel — may
            be retained or kept in de-identified form, as described in our Terms.
          </P>
        </Section>

        <Section title="8. Children's privacy">
          <P>
            The Service isn't directed at children, and you must meet the minimum age described
            in our Terms to use it. We don't knowingly collect information from children under
            that age.
          </P>
        </Section>

        <Section title="9. Changes to this policy">
          <P>
            We may update this policy as the Service changes. If we make a material change,
            we'll update the "Last updated" date above.
          </P>
        </Section>

        <Section title="10. Contact">
          <P>Questions about this policy? Reach out through the contact info on your account or channel.</P>
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}

function Section({ title, children }) {
  return (
    <section style={styles.section}>
      <h2 style={styles.h2}>{title}</h2>
      {children}
    </section>
  );
}

function P({ children }) {
  return <p style={styles.p}>{children}</p>;
}

const styles = {
  main: {
    maxWidth: 620,
    margin: "0 auto",
    padding: "32px 20px 40px",
  },
  back: {
    display: "inline-block",
    color: "var(--text-dim)",
    fontSize: "0.82rem",
    fontWeight: 600,
    textDecoration: "none",
    marginBottom: 22,
  },
  title: {
    fontFamily: "var(--font-head)",
    fontWeight: 800,
    fontSize: "1.9rem",
    margin: "0 0 6px",
  },
  updated: {
    color: "var(--text-dim)",
    fontSize: "0.82rem",
    margin: "0 0 22px",
  },
  notice: {
    background: "var(--panel)",
    border: "1px solid var(--line-soft)",
    borderRadius: "var(--radius-md)",
    padding: "14px 16px",
    color: "var(--text-dim)",
    fontSize: "0.85rem",
    lineHeight: 1.5,
    marginBottom: 30,
  },
  section: {
    marginBottom: 26,
  },
  h2: {
    fontSize: "1.05rem",
    fontWeight: 700,
    margin: "0 0 8px",
  },
  p: {
    color: "var(--text-dim)",
    fontSize: "0.92rem",
    lineHeight: 1.6,
    margin: "0 0 10px",
  },
  inlineLink: {
    color: "var(--cyan)",
    textDecoration: "underline",
  },
};
