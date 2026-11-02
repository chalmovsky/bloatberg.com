import { Hono } from 'hono'
import { isSection, sectionInfo, site } from '../config'
import {
  articlePath, getActiveLive, getLead, listPublished, searchPublished, type PublishedStory, getPublishedBySlug, listBriefs, listByAuthor, listBySection, listMostRead, listRelated,
  listStories,
} from '../db/articles'
import { getAuthorBySlug, listAuthors } from '../db/authors'
import type { AppEnv } from '../env'
import { ArticlePage } from '../views/pages/Article'
import { Home, type FrontData } from '../views/pages/Home'
import { todaysNumbers } from '../lib/markets'
import { isCountable, recordPageView, recordView, sourceOf } from '../db/views'
import { nowSeconds } from '../lib/dates'
import { SectionFront, StreamPage } from '../views/pages/Section'
import { Masthead, Newsletter, Static, Unsubscribe, staticPages } from '../views/pages/Static'
import { getByToken, isEmail, normalizeEmail, recentSignupsFromIp, subscribe, unsubscribe } from '../db/subscribers'
import { Avatar } from '../views/components'
import { Tips } from '../views/pages/Tips'
import { createPitch, recentFromIp } from '../db/pitches'
import { ipHash } from '../lib/iphash'

export const publicRoutes = new Hono<AppEnv>()

const siteUrl = (c: { env: AppEnv['Bindings'] }) => c.env.SITE_URL

publicRoutes.get('/', async (c) => {
  const db = c.env.DB
  const [lead, recent, mostRead, briefs, latest, live] = await Promise.all([
    getLead(db), listStories(db, 40), listMostRead(db, 6), listBriefs(db, 8), listPublished(db, 12), getActiveLive(db),
  ])
  if (isCountable(c.req.raw)) {
    c.executionCtx.waitUntil(recordPageView(db, 'home', sourceOf(c.req.raw), nowSeconds()).catch(() => {}))
  }
  return c.html(<Home siteUrl={siteUrl(c)} data={buildFront({ lead, recent, mostRead, briefs, latest, live })} />)
})

/** Lays the front out without repeating a story above the fold. */
function buildFront(x: {
  lead: PublishedStory | null; recent: PublishedStory[]; mostRead: PublishedStory[]; briefs: PublishedStory[]
  latest: PublishedStory[]; live: PublishedStory | null
}): FrontData {
  const used = new Set<number>()
  const take = (pool: PublishedStory[], n: number, ok: (s: PublishedStory) => boolean = () => true) => {
    const out: PublishedStory[] = []
    for (const s of pool) {
      if (out.length >= n) break
      if (!used.has(s.id) && ok(s)) {
        out.push(s)
        used.add(s.id)
      }
    }
    return out
  }
  if (x.lead) used.add(x.lead.id)
  const secondary = take(x.recent, 2, (s) => s.format !== 'brief' && !!s.image_key)
  const tertiary = take(x.recent, 3)
  // Section packages from what's left: one picture story plus up to two headlines each.
  const blocks: FrontData['blocks'] = []
  for (const sec of site.sections) {
    const stories = take(x.recent, 3, (s) => s.section === sec.slug)
    if (stories.length) blocks.push({ section: sec.slug, stories })
  }
  blocks.sort((a, b) => b.stories.length - a.stories.length)
  // Section packages run in rows of three; fewer than three and the row is dropped.
  const blockCount = blocks.length >= 6 ? 6 : blocks.length >= 3 ? 3 : 0
  return {
    lead: x.lead, secondary, tertiary,
    briefs: x.briefs,
    numbers: todaysNumbers(nowSeconds()),
    blocks: blocks.slice(0, blockCount),
    latest: x.latest.filter((s) => s.id !== x.lead?.id).slice(0, 10),
    mostRead: x.mostRead.slice(0, 5),
    alert: x.live && x.live.id !== x.lead?.id ? x.live : null,
  }
}

publicRoutes.get('/:yyyy{[0-9]{4}}/:mm{[0-9]{2}}/:dd{[0-9]{2}}/:slug', async (c) => {
  const story = await getPublishedBySlug(c.env.DB, c.req.param('slug'))
  if (!story) return c.notFound()
  const canonical = articlePath(story)
  if (canonical !== c.req.path) return c.redirect(canonical, 301)
  const db = c.env.DB
  const [related, briefs, mostRead, alert] = await Promise.all([
    listRelated(db, story, story.format === 'story' ? 5 : 4),
    story.format === 'brief' ? listBriefs(db, 5, story.id) : Promise.resolve([]),
    listMostRead(db, 6),
    getActiveLive(db),
  ])
  // Count the view after the response is sent, so readers never wait on it.
  if (isCountable(c.req.raw)) {
    c.executionCtx.waitUntil(recordView(db, story.id, sourceOf(c.req.raw), nowSeconds()).catch(() => {}))
  }
  return c.html(
    <ArticlePage siteUrl={siteUrl(c)} story={story} related={related} briefs={briefs} mostRead={mostRead.filter((s) => s.id !== story.id).slice(0, 5)} alert={alert} />,
  )
})

publicRoutes.get('/section/:section', async (c) => {
  const section = c.req.param('section')
  if (!isSection(section)) return c.notFound()
  const [stories, alert] = await Promise.all([listBySection(c.env.DB, section), getActiveLive(c.env.DB)])
  const info = sectionInfo(section)!
  return c.html(
    <SectionFront
      siteUrl={siteUrl(c)}
      section={section}
      title={info.long}
      blurb={info.blurb}
      alert={alert}
      meta={{ title: info.long, path: `/section/${section}`, description: `The latest ${info.long} news and analysis from ${site.name}. ${info.blurb}` }}
      stories={stories}
    />,
  )
})

publicRoutes.get('/author/:slug', async (c) => {
  const author = await getAuthorBySlug(c.env.DB, c.req.param('slug'))
  if (!author) return c.notFound()
  const stories = await listByAuthor(c.env.DB, author.id)
  return c.html(
    <StreamPage
      siteUrl={siteUrl(c)}
      meta={{ title: author.name, path: `/author/${author.slug}`, description: author.bio || `Stories by ${author.name}.` }}
      heading={
        <div class="author-head">
          <Avatar name={author.name} size="lg" />
          <div>
            {author.title && <p class="author-head-title">{author.title}</p>}
            <h1 class="stream-title">{author.name}</h1>
            {author.bio && <p class="author-head-bio">{author.bio}</p>}
          </div>
        </div>
      }
      stories={stories}
      empty={`${author.name} hasn’t published any stories yet.`}
    />,
  )
})

publicRoutes.get('/search', async (c) => {
  const q = (c.req.query('q') ?? '').trim().slice(0, 100)
  const stories = q.length >= 2 ? await searchPublished(c.env.DB, q) : []
  return c.html(
    <StreamPage
      siteUrl={siteUrl(c)}
      meta={{ title: q ? `Search: ${q}` : 'Search', path: '/search', noindex: !!q }}
      heading={
        <>
          <h1 class="stream-title">Search</h1>
          <form class="search-form" method="get" action="/search" role="search">
            <input type="search" name="q" value={q} placeholder="Search our archive" aria-label="Search" autofocus={!q} />
            <button class="btn" type="submit">Search</button>
          </form>
          {q.length >= 2 && (
            <p class="search-count">
              {stories.length === 0
                ? `No results for “${q}”. We checked twice, which is once more than usual.`
                : `${stories.length} ${stories.length === 1 ? 'result' : 'results'} for “${q}”`}
            </p>
          )}
        </>
      }
      stories={stories}
      empty={q ? 'Try a different word. Or a shorter one.' : 'Search every story we have ever made up.'}
    />,
  )
})

publicRoutes.get('/masthead', async (c) => c.html(<Masthead siteUrl={siteUrl(c)} authors={await listAuthors(c.env.DB)} />))

for (const slug of Object.keys(staticPages)) {
  publicRoutes.get(`/${slug}`, (c) => c.html(<Static siteUrl={siteUrl(c)} slug={slug} />))
}

publicRoutes.get('/briefs', async (c) => {
  const stories = await listBriefs(c.env.DB, 60)
  return c.html(
    <StreamPage
      siteUrl={siteUrl(c)}
      meta={{ title: 'In Brief', path: '/briefs', description: `Short takes on the day’s technology news from ${site.name}.` }}
      heading={
        <>
          <h1 class="stream-title">In Brief</h1>
          <p class="stream-sub">The day’s news, in one sentence or less.</p>
        </>
      }
      stories={stories}
      empty="No briefs yet."
    />,
  )
})

// ---------- Newsletter ----------

// Per network address. Kept high on purpose: iCloud Private Relay, mobile carriers and offices put many
// people behind one address. This only stops a script hammering the form; the honeypot catches most bots.
const SIGNUPS_PER_HOUR = 60

publicRoutes.get('/newsletter', async (c) =>
  c.html(
    <Newsletter siteUrl={siteUrl(c)} state={c.req.query('subscribed') === '1' ? 'subscribed' : undefined}
      week={await listMostRead(c.env.DB, 5, 7)} />,
  ),
)

publicRoutes.post('/newsletter', async (c) => {
  const form = await c.req.parseBody()
  // Honeypot: pretend it worked so bots move on.
  if (typeof form.website === 'string' && form.website.trim()) return c.redirect('/newsletter?subscribed=1', 303)
  const email = normalizeEmail(typeof form.email === 'string' ? form.email : '')
  if (!isEmail(email)) return c.html(<Newsletter siteUrl={siteUrl(c)} state="invalid" email={email} />, 422)
  const hash = await ipHash(c.env.IP_HASH_SALT, 'newsletter', c.req.header('CF-Connecting-IP') ?? 'local')
  if ((await recentSignupsFromIp(c.env.DB, hash, 3600)) >= SIGNUPS_PER_HOUR) {
    return c.html(<Newsletter siteUrl={siteUrl(c)} state="slow-down" email={email} />, 429)
  }
  // Same answer whether or not the address was already on the list, so the form can't be used to check.
  await subscribe(c.env.DB, email, hash)
  return c.redirect('/newsletter?subscribed=1', 303)
})

// Unsubscribing takes a button press, so email link scanners can't unsubscribe people by visiting the link.
publicRoutes.get('/newsletter/unsubscribe', async (c) => {
  const token = c.req.query('t') ?? ''
  const sub = /^[a-f0-9]{48}$/.test(token) ? await getByToken(c.env.DB, token) : null
  const state = !sub ? 'unknown' : sub.status === 'unsubscribed' ? 'done' : 'confirm'
  return c.html(<Unsubscribe siteUrl={siteUrl(c)} token={token} state={state} />)
})

publicRoutes.post('/newsletter/unsubscribe', async (c) => {
  const form = await c.req.parseBody()
  const token = typeof form.t === 'string' && /^[a-f0-9]{48}$/.test(form.t) ? form.t : ''
  const sub = token ? await getByToken(c.env.DB, token) : null
  if (sub) await unsubscribe(c.env.DB, token)
  return c.html(<Unsubscribe siteUrl={siteUrl(c)} token="" state={sub ? 'done' : 'unknown'} />, sub ? 200 : 404)
})

// Images from R2. Keys are content hashes, so they are cached forever.
publicRoutes.get('/img/:key{.+}', async (c) => {
  const key = c.req.param('key')
  if (!/^articles\/[a-f0-9]{64}\.webp$/.test(key)) return c.notFound()

  const cache = (globalThis as { caches?: { default?: Cache } }).caches?.default
  const cacheKey = new Request(new URL(c.req.url).toString())
  const hit = cache ? await cache.match(cacheKey) : undefined
  if (hit) return hit

  const obj = await c.env.IMAGES.get(key)
  if (!obj) return c.notFound()
  const headers = new Headers()
  obj.writeHttpMetadata(headers)
  headers.set('Content-Type', 'image/webp')
  headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  headers.set('ETag', obj.httpEtag)
  if (c.req.header('If-None-Match') === obj.httpEtag) return new Response(null, { status: 304, headers })
  const res = new Response(obj.body, { headers })
  if (cache) c.executionCtx.waitUntil(cache.put(cacheKey, res.clone()))
  return res
})

// ---------- Reader tips ----------

const TIP_LIMIT_PER_HOUR = 5

publicRoutes.get('/tips', (c) => {
  const sent = c.req.query('sent') === '1'
  return c.html(<Tips siteUrl={siteUrl(c)} state={sent ? 'sent' : undefined} />)
})

publicRoutes.post('/tips', async (c) => {
  const form = await c.req.parseBody()
  const kind = form.kind === 'observation' ? 'observation' : 'headline'
  const body = typeof form.body === 'string' ? form.body.replace(/\r\n/g, '\n').trim().slice(0, 1000) : ''
  // Honeypot: pretend it worked so bots move on.
  if (typeof form.website === 'string' && form.website.trim()) return c.redirect('/tips?sent=1', 303)
  if (!body) return c.html(<Tips siteUrl={siteUrl(c)} state="error" values={{ kind }} />, 422)
  const hash = await ipHash(c.env.IP_HASH_SALT, 'tips', c.req.header('CF-Connecting-IP') ?? 'local')
  if ((await recentFromIp(c.env.DB, hash, 3600)) >= TIP_LIMIT_PER_HOUR) {
    return c.html(<Tips siteUrl={siteUrl(c)} state="slow-down" values={{ kind, body }} />, 429)
  }
  await createPitch(c.env.DB, kind, body, hash)
  return c.redirect('/tips?sent=1', 303)
})
