# Seat Share ⚾

A tiny private site for sharing SF Giants season tickets with friends.

- **You** (`/admin`) mark each home game as *Keeping*, *Offered* (with an optional price), or *Hidden*, and manage a list of friends.
- **Each friend** gets a personal link (`/f/<token>`) you text them once. They see the schedule, tap **I'll take it** on any offered game, and can come back anytime to check what's still open or release a game they can't make.
- First tap wins — enforced by a database constraint, so two people can't both claim the same game.
- You still transfer the actual tickets in the MLB Ballpark app; the admin page has *paid* / *transferred* checkboxes per claim so you can track that.

No accounts, no SMS, no payments. Hosting is free on Vercel + Turso.

## Stack

Next.js 16 (App Router, Server Actions, TypeScript), Tailwind, Drizzle ORM, SQLite via libSQL — a local file in dev, [Turso](https://turso.tech) in production.

## Local development

```bash
cp .env.example .env.local     # edit ADMIN_PASSWORD
npm install
npm run setup                  # creates local.db tables + imports the Giants home schedule
npm run dev
```

- http://localhost:3000/admin → sign in with `ADMIN_PASSWORD`
- **Friends** tab → add a name → copy their link
- **Games** tab → click **Offer all hidden games**, then mark the ones you're keeping

### Scripts

| Command | What it does |
|---|---|
| `npm run db:push` | Create/update tables to match `lib/db/schema.ts` (works against local file or Turso, based on `.env.local`) |
| `npm run seed` | Import this year's Giants home schedule from MLB's public Stats API. Safe to re-run; refreshes dates/times without touching your statuses, prices, or claims. |
| `npm run seed -- 2027` | Import a specific season (run this when next year's schedule is released) |
| `npm run setup` | `db:push` + `seed` |

## Deploying to Vercel

Vercel's filesystem is read-only/ephemeral, so the SQLite file has to live somewhere else. Turso is hosted SQLite with a free tier that's far more than this app needs. Total cost: **$0** (plus a domain if you want one).

### 1. Create the Turso database

```bash
# install the CLI (macOS)
brew install tursodatabase/tap/turso
turso auth signup            # or: turso auth login

turso db create seat-share
turso db show seat-share --url          # → libsql://seat-share-<you>.turso.io
turso db tokens create seat-share       # → a long token
```

### 2. Create the tables and seed the schedule

Point your local env at Turso temporarily and run the same scripts you used locally:

```bash
DATABASE_URL="libsql://seat-share-<you>.turso.io" \
DATABASE_AUTH_TOKEN="<token>" \
npm run setup
```

(Or put those two values in `.env.local`, run `npm run setup`, and switch back to `file:local.db` afterwards.)

### 3. Push the repo to GitHub

```bash
git add -A
git commit -m "Seat share"
gh repo create seat-share --private --source=. --push   # or push to a repo you created on github.com
```

### 4. Create the Vercel project

1. Go to https://vercel.com/new and import the GitHub repo. Framework preset auto-detects Next.js — leave build settings as is.
2. Before clicking **Deploy**, expand **Environment Variables** and add:

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | `libsql://seat-share-<you>.turso.io` |
   | `DATABASE_AUTH_TOKEN` | the token from step 1 |
   | `ADMIN_PASSWORD` | a long password for `/admin` |
   | `APP_URL` | your production URL, e.g. `https://seat-share.vercel.app` (you can fill this in after the first deploy and redeploy) |

3. Click **Deploy**. ~1 minute later you'll have a URL.

Alternatively, from the terminal:

```bash
npm i -g vercel
vercel link
vercel env add DATABASE_URL production
vercel env add DATABASE_AUTH_TOKEN production
vercel env add ADMIN_PASSWORD production
vercel env add APP_URL production
vercel --prod
```

### 5. Use it

1. Open `https://<your-app>.vercel.app/admin`, sign in.
2. **Friends** → add everyone → copy each link.
3. **Games** → **Offer all hidden games**, then click **Keeping** on the ones you're going to. Set prices if you want.
4. Text each friend their link. Done — they'll come back to it on their own.

Every `git push` to `main` redeploys automatically.

### Custom domain (optional)

Vercel project → **Settings → Domains** → add your domain and follow the DNS instructions. Then update `APP_URL` so friend links use the nice domain.

### Next season

When MLB publishes next year's schedule:

```bash
DATABASE_URL=... DATABASE_AUTH_TOKEN=... npm run seed -- 2027
```

New games arrive as *Hidden*; offer them from the admin page when you're ready.

## How it works

```
lib/db/schema.ts     games / friends / claims tables (claims.game_id is UNIQUE → first claim wins)
lib/actions.ts       all mutations, as Next.js Server Actions
lib/queries.ts       read helpers
lib/auth.ts          admin cookie (SHA-256 of ADMIN_PASSWORD, httpOnly)
app/f/[token]/       friend view
app/admin/           login + games + friends pages (route group (authed) guards with a redirect)
scripts/seed.ts      MLB Stats API → games table
```

Friend links are the only "auth" for friends: a 16-char random token in the URL. Anyone with a link can claim as that person, which is fine for a friend group — if a link leaks, remove the friend and re-add them to get a fresh token.

## Things deliberately left out (for now)

- Notifications when a game is posted (email / push). You can text the group when you post something hot.
- Splitting a pair of seats between two people.
- Payment collection. Track it with the *paid* flag and use Venmo.
- A cutoff for releasing a claimed game close to game day.
