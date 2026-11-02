# Bloatberg

A satirical tech publication built to look like (and be even better technologically) than a real, 
well-funded tech news outlet.

Hono + `hono/jsx` on Cloudflare Workers, D1 for articles, R2 for images, Cloudflare Access for `/admin`.
Public pages ship zero JavaScript; the admin ships one small script (`public/admin/editor.js`).

Everything beneath this line is mostly for my agent friends. Feel free to read it though:)
___

## Run locally

```bash
bun install
cp .dev.vars.example .dev.vars   # set DEV_AUTH_EMAIL / OWNER_EMAIL to your email
bun run db:migrate:local
bun run db:seed:local
bun run dev                      # http://localhost:8787  ·  CMS at /admin
```

Locally, `/admin` signs you in as `DEV_AUTH_EMAIL` (only when `ENVIRONMENT=development`).
D1 and R2 are simulated by Wrangler under `.wrangler/state`.

| Script | What it does |
| --- | --- |
| `bun run dev` | Local server with local D1 + R2 |
| `bun run db:build-seed` | Regenerates `migrations/seed.sql` from `scripts/seed-content.ts` !!!CAREFUL MOST ARE NOT FUNNY!!! |
| `bun run db:seed:local` | Re-seeds the sample stories and staff (keeps anything you wrote in the CMS) |
| `bun run db:reset:local` | Wipes local D1, migrates and seeds |

## Renaming

The site and newsletter names live in `src/config.ts`, along with the founding year, section blurbs,
the Bloatberg Terminal ticker, the "By the Numbers" stats and the `/masthead` staff list. A few static files
also carry the name: `public/site.webmanifest`, the image credits in `scripts/seed-content.ts`, the
contact addresses (`@bloatberg.com`) in `src/views/pages/Static.tsx`, and the default share card
(`assets/og-default.html` → screenshot to `public/og-default.png`), and the app icon (`assets/icon.html` → screenshot at 512×512, then resized to `public/icon-*.png`, `favicon-32.png`, `apple-touch-icon.png`, `favicon.ico` and embedded in `favicon.svg`).

## Design system

- **Type:** the nameplate is Old Standard TT in caps (`public/fonts/nameplate.woff2`), headlines and
  body are Newsreader (variable, with optical sizes) and labels/UI are Libre Franklin. All self-hosted.
- **Fronts:** the home page builds a lead package, secondary stories, In Brief, section packages,
  By the Numbers and The Latest without repeating a story above the fold (`buildFront` in
  `src/routes/public.tsx`). Live coverage updated in the last day also shows as an alert bar site-wide.
- **The Bloatberg Terminal:** the market strip under the masthead. Values drift through the day (and a little every minute) from the bases in
  `MARKETS` (seeded by date and minute, so everyone sees the same numbers at the same moment), plus "time since" timers (CVE 9.0+, DNS outages, "X is a scam" posts). AGI ETA never moves.
- **Article furniture:** label (Exclusive, Scoop, Analysis, Review…), dateline, author job title and
  avatar, share menu, an inline related story after the 4th paragraph and a newsletter box after the
  9th, topics, author box and a reading-progress bar (CSS scroll timeline, no JS). Labels, datelines
  and job titles are set in the CMS (editor and profile).
- **Art:** `scripts/art.ts` holds each illustration as HTML/CSS (tilted UI "screenshots" on color
  fields, halftone shadows, grain, hand-drawn rings) and renders them with headless Chrome.

## Deploying to bloatberg.com

1. `bunx wrangler login`
2. `bunx wrangler d1 create bloatberg` → paste the `database_id` into `wrangler.jsonc`
3. `bunx wrangler r2 bucket create bloatberg-images` (R2 needs a card on file)
4. Add `bloatberg.com` to Cloudflare (point the registrar's nameservers at Cloudflare). `routes` and `SITE_URL` are already set; set `OWNER_EMAIL` in `wrangler.jsonc`
5. `bun run db:migrate:remote && bun run deploy`
6. Set up Cloudflare Access for `bloatberg.com/admin`, copy the AUD tag and team domain into `ACCESS_AUD` / `ACCESS_TEAM_DOMAIN`, deploy again
   Also set the IP-hashing key once: `openssl rand -hex 32 | bunx wrangler secret put IP_HASH_SALT` (the tips and newsletter forms refuse to work without it)
7. Check: `curl -I https://bloatberg.com/admin` must redirect to Access, never show the dashboard

`seed.sql` is never applied remotely: `migrations_pattern` only matches numbered migration files.

## Article formats

Pick one at the top of the editor:

- **Story** — a regular article with a picture.
- **Live updates** — timestamped updates, newest first, each with its own headline. Use **+ Live update**
  in the editor, or write `@6:10 PM ET` on its own line followed by `## Headline` and the text.
  Fronts show a pulsing **LIVE** badge (for 24 hours after the last update) plus "Latest: …" with the newest
  headline, and live stories sort by their last update so active coverage rises to the top.
  The article page gets a "Key updates" list and a timeline with linkable anchors.
  **End live coverage** (editor button) archives it: no LIVE badge or alert bar, a "This live coverage has ended"
  note, "Final update:" on fronts, and every update kept. **Resume live coverage** undoes it (`live_ended_at`).
- **In Brief** — headline only, optional one-line body, no picture needed. Shown in the front page's
  "In Brief" box and at `/briefs`. On save, the editor draws a headline share card in the browser and
  uploads it, so pasted links still get a large-image preview.

## Joke formats (embeds)

Inside any article body, a fenced block renders as an embedded artifact. Use the **Insert** buttons
in the editor to drop in a template. A story can be all embed, or prose with embeds in between.

| Fence | Looks like |
| --- | --- |
| ` ```thread ` | A developer-forum comment thread (nested by indenting 2 spaces) |
| ` ```issue ` | An issue tracker page with labels, comments, reactions and timeline events |
| ` ```changelog ` | Release notes; `### Added / Fixed / Removed / Security…` become colored tags |
| ` ```chat ` | A team chat channel |
| ` ```incident ` | A status-page incident with a timeline |
| ` ```memo ` | A leaked internal memo, stamped |
| ` ```quote ` | A pull quote; the last line starting with `—` is the attribution. Readers can share it as an image |
| ` ```review ` | The review verdict box (score, badge, verdict, good/bad, specs). Uses the site's own look; the score is saved as `review_score` and shown as a badge on pictures |

Shared syntax: `key: value` lines at the top are settings (`title:`, `labels:`, `channel:`…),
`@name · meta` starts an entry, `+ 👍 12 · 😬 3` adds reactions, and `! text` adds an issue timeline event.
Embeds use generic, unbranded looks on purpose — no real logos or product names in the chrome.
They're rendered at save time like the rest of the body (`src/lib/embeds.ts`).

## Stats (page views)

Article pages count anonymous views per article per day (`article_views`) and where they came from
(`article_sources`: referring site, one of our own pages, or "Direct"). No IPs, cookies or user IDs are
stored. Bots and link unfurlers, prefetches and editors signed in through Cloudflare Access are skipped.
The count is written after the response is sent.

- **CMS:** `/admin/stats` (7/30/90 days: totals, views per day, sources, top articles with sparklines),
  `/admin/stats/<id>` for one article, a Views column in the article list, and `/admin/stats.csv`.
- **Most Read** on the site ranks by views over today and yesterday, topped up with featured stories.
- The local seed includes sample views so the stats pages have data; `bun run db:clear-views:local` removes them.
  The sample is never applied remotely.

## Share cards

Each article has a 1200×630 share card (`share_key`): picture + nameplate + kicker + headline, because X no longer
shows headlines under link previews. The CMS draws it in the browser on save (`drawCard` in
`public/admin/editor.js`) and uploads it to R2; `share_for` records what it was drawn for, so it's redrawn when
the headline, picture, section, label or review score changes. Seed stories get theirs from
`bun run share-cards` (Chrome + cwebp → `public/placeholder/share/`). `og:image` / `twitter:image` use the card.
The share menu (`public/js/share.js`, article pages only) copies links and uses the Web Share API on phones;
without JavaScript every option is still a plain link.

`share.js` also makes two kinds of image in the reader's browser with canvas, shown in a `<dialog>` with
Share image (Web Share with a file, phones), Copy image (`ClipboardItem`), Save image and Copy link:
**Screenshot** (headline card, data from `data-*` on `.sharebar`) and **Share quote** (one per ` ```quote `).
Quote cards carry a small "Satire" label, since they travel without the article around them.

## Asset versions

CSS and JS are linked as `/css/site.css?v=<etag>` (`src/lib/assets.ts`), so a browser never mixes an old
cached stylesheet with a new script. New files are linked through `asset()` and listed in `FILES` there.

## Appearance modes

`data-theme` on `<html>`: `light`, `dark`, `random`, `enterprise`, `ai` (none = follow the system). A small
inline script in `<head>` (`THEME_BOOT` in `src/views/Layout.tsx`) applies the saved mode before the page paints;
`public/js/theme.js` wires up the buttons and adds each mode's extras (seed tag, Enterprise paywall, AI summary
and Regenerate). Colours are CSS variables in `public/css/site.css`; Random builds an OKLCH palette from one seed.

## Newsletter

Sign-ups go to the `subscribers` table (email, status, token, terms version, hashed IP for rate limiting; 60 per
hour per connection, honeypot field). Unsubscribing needs a button press on `/newsletter/unsubscribe?t=…` so
link scanners can't do it. The owner sees `/admin/subscribers` and can export a CSV for an email service.
No email is sent by the site. The newsletter is The Weekly Bloat: the five most-read stories of the last 7
days (`listMostRead(db, 5, 7)`), which `/newsletter` also shows as "This week so far". The legal text is on
`/privacy#newsletter` and `/terms#newsletter`; bump `NEWSLETTER_TERMS_VERSION` in `src/db/subscribers.ts`
when the newsletter terms change.

## Reader tips

`/tips` takes anonymous headline ideas and observations: no name, no email, no credit, CC0.
Spam protection is a honeypot field plus 5 tips per IP per hour (IPs are stored only as a hash).
Authors vote, claim, reject or turn tips into drafts at `/admin/pitches`.
