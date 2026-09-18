# Aux Cord

A minimal live-review tool for one creator: fans submit a track link, you review and
queue it from a private dashboard, and a public overlay shows what's playing and
what's next — meant to run as an OBS/Streamlabs browser source.

## Pages

- `/` — landing page with links
- `/submit` — public submission form (name, link, optional message)
- `/overlay` — public, add this as a browser source on stream. Shows now playing,
  up next, and where to submit. Polls every 4s.
- `/login` and `/admin` — password-protected dashboard. Approve/queue/play/reject
  submissions.

## Local setup

```bash
npm install
cp .env.local.example .env.local   # if you don't already have one
npx prisma migrate dev --name init
npm run dev
```

Set two env vars (in `.env.local` for dev, or your host's env settings in
production):

- `DATABASE_URL` — `file:./dev.db` for local dev. For production, point this at a
  real Postgres/SQLite file your host persists (see Deploying, below).
- `ADMIN_PASSWORD` — the password for `/admin`. Change this from the default
  before you ever deploy this publicly.

## Deploying

This is a standard Next.js app, deployable anywhere that runs Node (Railway,
Render, Vercel, Fly.io, etc.). Two things to watch for:

1. **SQLite + ephemeral filesystems don't mix.** Many hosts wipe local disk on
   every deploy/restart, which would silently erase your submissions. Either use
   a host with a persistent volume (Railway volumes work fine — mount it and
   point `DATABASE_URL` at a file inside the volume), or swap to a hosted
   Postgres and change the `provider` in `prisma/schema.prisma` from `sqlite` to
   `postgresql`.
2. **Set `ADMIN_PASSWORD` before deploying.** Without it, `/admin` refuses to
   work (`checkPassword` will never succeed) rather than falling open.

Run `npx prisma migrate deploy` (not `migrate dev`) as part of your build/deploy
step in production.

## What's deliberately not built yet

- File uploads (submission is link-only for now — Spotify/YouTube/etc URLs)
- Multi-creator support — this is single-tenant by design
- Any moderation beyond approve/reject (no profanity filtering, rate limiting, etc.)
- The `next` dependency is pinned to a patched 14.2.x release, not the current
  major (16.x) — upgrading is a bigger, separate step since Next 16 has breaking
  changes to the pages/app router.
