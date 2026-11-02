# Bloatberg cheat sheet

Everything you can publish, and where it shows up. CMS: `/admin`.

## Article types

Pick one at the top of the editor.

| Type | What it is | Needs a picture? |
| --- | --- | --- |
| **Story** | A normal article. | Yes |
| **Live updates** | Running coverage. Click **+ Live update** for each new entry (time + headline + optional text). Gets a red **LIVE** badge for 24 h after the last update and jumps to the top of the front page. When it's over, press **End live coverage**: the badge becomes "Coverage ended", and every update and headline stays. **Resume live coverage** undoes it. | Yes |
| **In Brief** | One headline, plus one optional line. Shows in the In Brief band and at `/briefs`. | No (a share card is made for you) |

## Options on every article

- **Section**: AI, Startups, Dev, Hardware, Policy, Culture, **Reviews**, **Visionaries** (the real-personalities desk).
- **Byline** (owner only): who the story is credited to. Picking a section suggests that desk's writer
  (AI → Mara Okafor, Startups → Nadia Farouk, Dev → Theo Lindqvist, Hardware and Reviews → Ben Hartley,
  Policy → Celeste Moreau, Culture → Jonah Pike, Visionaries → Clementine Ashby; Ines Carvalho does breaking
  news). Once you pick someone by hand, changing the section won't change them. Desks are set in `src/config.ts`.
- **Dek**: the subheadline under the headline.
- **Label**: Exclusive, Scoop, Analysis, Investigation, Explainer, Review, Interview, Opinion. Shown above the headline.
- **Dateline**: e.g. `SAN FRANCISCO`. Starts the first paragraph (and replaces the big first letter).
- **Feature on front page**: lets the story take the big lead spot.
- **Picture**: drag in any image (turned into WebP automatically). Add a caption and a credit.

## Sharing

- Every article gets a **share card** (1200×630): the picture, the BLOATBERG name and the headline. It's what
  people see when the link is posted on X, Bluesky, LinkedIn, WhatsApp, iMessage, Slack… It's made automatically
  when you save, and remade when the headline, picture, section or label changes. You can see it in the editor
  under **Share card**.
- The article's **Share** menu: Copy link (copies, says "Link copied"), Email, X, Bluesky, Threads, LinkedIn,
  Facebook, Reddit, Hacker News, WhatsApp, Telegram. On phones it opens the phone's own share sheet.
- **Screenshot** button next to Share: makes a clean picture of the headline (nameplate, headline, dek, byline,
  picture) that readers can copy, save, or send through the phone's share sheet. Made in the reader's browser.
  Hovering the button (on computers) shows a preview, and every article ends with a **Share it as a picture**
  box showing a thumbnail of the screenshot.
- **Pull quotes**: in the editor, Insert → **Pull quote**. It shows in the article as a big quote with a
  **Share quote** button that turns it into a picture. Write it like this:

      ```quote
      The words, without quote marks.
      — Who said it, their job
      ```

## Appearance

The ◐ button in the header (inside the Sections menu on phones): **System, Light, Dark, Random, Enterprise, AI**.
Each reader's choice is remembered in their browser.

- **Random**: new colours on every page, with "Theme seed 0x…" and a **Reroll** button in the corner.
- **Enterprise**: grey, no serif fonts, black-and-white pictures, "Contact sales" on every headline, and the
  third paragraph of each article locked behind Bloatberg Enterprise.
- **AI**: purple, ✨ on every headline, an "AI summary" (it's the headline) and a **Regenerate** button that
  retypes the same headline.

## Newsletter

- **The Weekly Bloat**: the week's five most-read stories, every Friday. `/newsletter` shows "This week so far"
  (top 5 by views over the last 7 days), which is exactly what the email would contain.
- Readers sign up at `/newsletter`, in the box on the front page, or in the box inside articles.
- **CMS → Subscribers** (owner only): the list, Download CSV, Delete. Nothing is emailed yet: when you pick an
  email service, import the CSV and name the service in the privacy policy.
- Unsubscribe link for each person: `/newsletter/unsubscribe?t=<token>` (the token is in the CSV).

## Joke embeds

Click the **Insert** buttons in the editor, then edit the template.

| Embed | Looks like |
| --- | --- |
| `thread` | Forum comments (indent 2 spaces to reply) |
| `issue` | A code-hosting issue with labels, reactions and "closed this" events |
| `changelog` | Release notes (`### Added`, `### Fixed`, `### Removed`…) |
| `chat` | A team chat channel |
| `incident` | A status page ("Degraded vibes") |
| `memo` | A leaked internal memo with a stamp |
| `quote` | A pull quote with a **Share quote** button (last line `— Name, job` is who said it) |
| `review` | The review verdict box: score circle, badge, price, verdict, The good / The bad, specs. Its score also appears as a badge on the story's picture everywhere. |

Review box syntax: `product:`, `price:`, `score: 7.5`, `badge: Editor’s Choice` (or `Bloat Award`, `Do Not Buy`),
`verdict:`, `specs: Weight = 4 g; Battery = 6 days`, then `+ good thing` and `- bad thing` lines.

Mini syntax for the others: `key: value` lines at the top, `@name · 2h ago` starts a comment/message,
`+ 👍 12 · 😬 3` adds reactions, `! @someone closed this` adds an event.

## Front page, top to bottom

Lead story (or live coverage) → top stories → **Most Read** (real page views) and the
the newsletter box on the right → **In Brief** → section blocks → **By the Numbers** → **The Latest**.

## Things you edit in code (`src/config.ts`)

| What | Where |
| --- | --- |
| Site name, tagline, sections | `site` |
| **Bloatberg Terminal** ticker (numbers + "time since last CVE/DNS/scam post" timers) | `MARKETS` |
| **By the Numbers** stats | `NUMBERS` |
| `/masthead` staff list | `MASTHEAD` (reporters come from the Authors page) |

## CMS pages

- **Articles**: everything, with a **Views** column. Edit, preview, publish, unpublish.
- **Pitches**: reader tips from `/tips`. Vote, claim, or turn one into a draft. No credit, ever.
- **Stats**: views per day, where readers came from, top articles, CSV download.
- **Profile**: your byline name, job title and bio. **Authors** (owner only): everyone on staff.

## Removing articles

- Open the article in the CMS → **Delete** (owner only). Its stats go with it.
- The sample stories return if you run `bun run db:seed:local`. To remove one for good, delete it from
  `scripts/seed-content.ts`, then run `bun run db:build-seed`.
- None of the sample stories go to the live site unless you put them there.
