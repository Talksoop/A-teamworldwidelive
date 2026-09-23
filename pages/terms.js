import Head from "next/head";
import SiteFooter from "../lib/SiteFooter";

const LAST_UPDATED = "September 23, 2026";

export default function Terms() {
  return (
    <>
      <Head>
        <title>Terms of Service — A-Team Worldwide Live</title>
      </Head>
      <main style={styles.main}>
        <a href="/" style={styles.back}>
          ← A-Team Worldwide Live
        </a>
        <h1 style={styles.title}>Terms of Service</h1>
        <p style={styles.updated}>Last updated: {LAST_UPDATED}</p>

        <div style={styles.notice}>
          This is a starting template, not legal advice. It hasn't been reviewed by a lawyer and
          doesn't account for your specific business, location, or the laws that apply to you. Have
          an attorney review and customize it — especially the payments, refunds, and governing law
          sections — before relying on it.
        </div>

        <Section title="1. Agreement to these terms">
          <P>
            These Terms of Service ("Terms") govern your access to and use of A-Team Worldwide Live
            (the "Service"), including our website, live queue and review tools, battles, AMA
            requests, and go-live scheduling. By creating an account or otherwise using the Service,
            you agree to these Terms. If you don't agree, don't use the Service.
          </P>
        </Section>

        <Section title="2. What the Service is">
          <P>
            The Service lets music creators ("Creators") run a public channel where fans ("Fans")
            submit tracks for live review, vote in song battles, request paid one-on-one feedback
            (AMA), and follow a Creator's schedule. Some features are paid and processed through
            Stripe.
          </P>
        </Section>

        <Section title="3. Accounts">
          <P>
            You need an account to submit songs, follow Creators, or run a channel. A Creator account
            and a Fan account are separate, but the same person can hold both, and logging into one
            can also link the matching account under the same email.
          </P>
          <P>
            You're responsible for keeping your login credentials secure and for everything that
            happens under your account. Give us accurate information when you sign up, and keep it
            current. You must be old enough, under the laws that apply to you, to enter into these
            Terms — this Service is not directed at children, and if you're not old enough to agree
            to these Terms on your own, don't use it.
          </P>
        </Section>

        <Section title="4. Content you submit">
          <P>
            Anything you submit — a song link, an uploaded file, a message, a battle entry, an AMA
            question — is "Your Content." You keep whatever rights you already have in it. By
            submitting it, you give us a license to host, store, display, stream, and otherwise use
            it as needed to run the Service (for example, playing it in a Creator's queue or overlay,
            or including it in a battle).
          </P>
          <P>
            You're responsible for having the rights to submit whatever you submit. Don't submit
            anything that infringes someone else's copyright or other rights, that you don't have
            permission to share, or that's illegal, harassing, or otherwise violates these Terms.
          </P>
        </Section>

        <Section title="5. Payments">
          <P>
            Paid features — skip tiers, reactions, AMA requests, and anything else marked paid — are
            processed by Stripe. By making a payment, you authorize the charge. A percentage of each
            paid transaction goes to the platform as a fee, with the rest paid out to the Creator; the
            exact fee is shown to Creators when they connect their payout account.
          </P>
          <P>
            Payments are for services rendered at the time of the transaction (queue placement,
            reactions, a scheduled response) rather than goods you can return, so refunds aren't
            guaranteed — a Creator may offer one at their discretion, and we'll otherwise follow
            whatever refund rights the law where you live gives you.
          </P>
        </Section>

        <Section title="6. Radio recommendations">
          <P>
            Some Creators can recommend a submitted song for radio play. If yours is recommended, the
            name, email, and song info you submitted are shared with Connect Diva Media so they can
            invite you to submit directly to their radio program, and you'll get an automated email
            with that invitation and a link to their submission page. Submitting a song to a channel
            where this feature is available means you're okay with that information being shared if
            a Creator recommends it.
          </P>
        </Section>

        <Section title="7. Things you can't do">
          <P>
            Don't use the Service to spam, harass, or impersonate someone; submit content you don't
            have rights to; try to get around payment for a paid feature; interfere with or disrupt
            the Service (including other users' queues, battles, or streams); or use it for anything
            illegal.
          </P>
        </Section>

        <Section title="8. Ending your account">
          <P>
            You can delete your account at any time from your account settings — Creators from the
            Channel tab in Admin, Fans from their account page. Deleting one doesn't automatically
            delete the other if you hold both; each is removed separately. When you delete an
            account, we remove what's reasonably tied to it; some records (like payment history we're
            required to keep, or a Creator's own record of a submission you made to their channel) may
            be retained or kept in de-identified form.
          </P>
          <P>
            We can suspend or terminate an account that violates these Terms, or that we reasonably
            believe puts the Service or other users at risk.
          </P>
        </Section>

        <Section title="9. Third-party links and services">
          <P>
            The Service links out to third-party platforms — Spotify, YouTube, SoundCloud, TikTok,
            Stripe, Connect Diva Media, and others a Creator or Fan may reference. We don't control
            those services and aren't responsible for their content, policies, or availability.
          </P>
        </Section>

        <Section title="10. Disclaimers">
          <P>
            The Service is provided "as is," without warranties of any kind, to the extent the law
            allows. We don't guarantee it will be uninterrupted, error-free, or available at all
            times.
          </P>
        </Section>

        <Section title="11. Limitation of liability">
          <P>
            To the extent the law allows, A-Team Worldwide Live won't be liable for indirect,
            incidental, or consequential damages arising from your use of the Service. Nothing here
            limits liability where the law doesn't allow it to be limited.
          </P>
        </Section>

        <Section title="12. Changes to these terms">
          <P>
            We may update these Terms as the Service changes. If we make a material change, we'll
            update the "Last updated" date above; continuing to use the Service after that means you
            accept the update.
          </P>
        </Section>

        <Section title="13. Governing law">
          <P>
            [Owner to fill in: the state/country whose law governs these Terms, and where disputes
            will be handled.]
          </P>
        </Section>

        <Section title="14. Contact">
          <P>Questions about these Terms? Reach out through the contact info on your account or channel.</P>
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
    padding: "32px 20px 80px",
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
};
