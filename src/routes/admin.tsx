import { Hono, type Context } from 'hono'
import { isLabel, isSection } from '../config'
import {
  createArticle, deleteArticle, isImageKey, setLiveEnded, getById, listAdmin, listBriefs, listRelated, publishArticle, unpublishArticle, uniqueSlug,
  setArticleAuthor, updateArticle, type ArticleInput, type PublishedStory, type Story,
} from '../db/articles'
import { authorSlugTaken, getAuthorById, listAuthors, updateProfile, type Author } from '../db/authors'
import type { AppEnv } from '../env'
import { nowSeconds } from '../lib/dates'
import { isFormat, renderBody } from '../lib/body'
import { slugify } from '../lib/slug'
import { requireAccess, requireSameOrigin } from '../middleware/access'
import { ArticlePage } from '../views/pages/Article'
import { Authors } from '../views/pages/admin/Authors'
import { Editor, emptyValues, valuesFrom, type EditorValues } from '../views/pages/admin/Editor'
import { AdminList } from '../views/pages/admin/List'
import { Profile } from '../views/pages/admin/Profile'
import { Pitches } from '../views/pages/admin/Pitches'
import { allDaily, dailyViews, dayKey, lastDays, pageSources, pageTotal, seriesFor, topArticles, topSources, totalViews, viewsByArticle } from '../db/views'
import { RANGES, StatsArticle, StatsOverview, type Kpis, type Range } from '../views/pages/admin/Stats'
import { activeSubscribers, deleteSubscriber, listSubscribers, subscriberCounts } from '../db/subscribers'
import { Subscribers } from '../views/pages/admin/Subscribers'
import { deletePitch, getPitch, listPitches, pitchCounts, setPitchStatus, toggleVote } from '../db/pitches'

type C = Context<AppEnv>

export const adminRoutes = new Hono<AppEnv>()

adminRoutes.use('*', requireSameOrigin, requireAccess)
adminRoutes.use('*', async (c, next) => {
  await next()
  c.header('Cache-Control', 'private, no-store')
  c.header('X-Robots-Tag', 'noindex')
})

const canEdit = (author: Author, a: Story) => author.role === 'owner' || a.author_id === author.id
const msgOf = (c: C) => c.req.query('msg')

// ---------- Form handling ----------

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\r\n/g, '\n').trim().slice(0, max) : '')

function readValues(form: Record<string, unknown>): EditorValues {
  const section = str(form.section, 40)
  const imageKey = str(form.image_key, 200)
  return {
    title: str(form.title, 200).replace(/\s*\n+\s*/g, ' '),
    dek: str(form.dek, 400).replace(/\s*\n+\s*/g, ' '),
    section: isSection(section) ? section : emptyValues.section,
    body_md: str(form.body_md, 200_000),
    body_html: '',
    slug: str(form.slug, 120),
    // Only R2 content-hash keys or seeded placeholder paths are accepted.
    image_key: isImageKey(imageKey) ? imageKey : '',
    share_key: isImageKey(str(form.share_key, 200)) ? str(form.share_key, 200) : '',
    share_for: str(form.share_for, 600),
    image_alt: str(form.image_alt, 300),
    image_credit: str(form.image_credit, 120),
    label: isLabel(str(form.label, 20)) ? str(form.label, 20) : '',
    dateline: str(form.dateline, 40).replace(/\s+/g, ' ').toUpperCase(),
    featured: form.featured === '1' || form.featured === 'on',
    format: isFormat(str(form.format, 10)) ? (str(form.format, 10) as EditorValues['format']) : 'story',
    author_id: Number.parseInt(str(form.author_id, 12), 10) || 0,
  }
}

/** Briefs don't need a picture; stories and live coverage do. */
const needsImage = (v: { format: string; image_key: string }) => v.format !== 'brief' && !v.image_key

async function toInput(c: C, v: EditorValues, exceptId?: number): Promise<{ input: ArticleInput; slugChanged: boolean }> {
  const wanted = slugify(v.slug || v.title)
  const slug = await uniqueSlug(c.env.DB, wanted, exceptId)
  return {
    slugChanged: v.slug !== '' && slug !== wanted,
    input: {
      slug,
      title: v.title,
      dek: v.dek,
      section: v.section,
      body_md: v.body_md,
      ...renderBody(v.format, v.body_md), // rendered once, on save
      format: v.format,
      image_key: v.image_key,
      image_alt: v.image_alt,
      image_credit: v.image_credit,
      label: v.label,
      dateline: v.dateline,
      share_key: v.share_key,
      share_for: v.share_for,
      featured: v.featured ? 1 : 0,
    },
  }
}

async function rerender(c: C, v: EditorValues, msg: string, article?: Story) {
  v.body_html = renderBody(v.format, v.body_md).body_html
  return c.html(<Editor author={c.get('author')} siteUrl={c.env.SITE_URL} article={article} values={v} msg={msg} bylines={await listAuthors(c.env.DB)} />, 422)
}

/** The byline to save: owners may credit any author; everyone else is credited as themselves. */
async function bylineFor(c: C, v: EditorValues, fallback: number) {
  const me = c.get('author')
  if (me.role !== 'owner' || !v.author_id) return fallback
  return (await getAuthorById(c.env.DB, v.author_id))?.id ?? fallback
}

async function loadEditable(c: C): Promise<Story | Response> {
  const id = Number(c.req.param('id'))
  const article = Number.isInteger(id) ? await getById(c.env.DB, id) : null
  if (!article) return c.notFound()
  if (!canEdit(c.get('author'), article)) return c.redirect('/admin?msg=forbidden', 303)
  return article
}

/** Saves the posted form onto an existing article. Returns the message to show, if any. */
async function saveExisting(c: C, article: Story, v: EditorValues) {
  const { input, slugChanged } = await toInput(c, v, article.id)
  await updateArticle(c.env.DB, article.id, input)
  const byline = await bylineFor(c, v, article.author_id)
  if (byline !== article.author_id) await setArticleAuthor(c.env.DB, article.id, byline)
  return slugChanged ? 'slug-taken' : undefined
}

// ---------- Pages ----------

adminRoutes.get('/', async (c) => {
  const [articles, views] = await Promise.all([listAdmin(c.env.DB), viewsByArticle(c.env.DB, dayKey(nowSeconds(), 6))])
  return c.html(<AdminList author={c.get('author')} articles={articles} views={views} msg={msgOf(c)} />)
})

adminRoutes.get('/new', async (c) =>
  c.html(<Editor author={c.get('author')} siteUrl={c.env.SITE_URL} values={{ ...emptyValues }} msg={msgOf(c)} bylines={await listAuthors(c.env.DB)} />),
)

adminRoutes.get('/edit/:id', async (c) => {
  const article = await loadEditable(c)
  if (article instanceof Response) return article
  return c.html(<Editor author={c.get('author')} siteUrl={c.env.SITE_URL} article={article} values={valuesFrom(article)} msg={msgOf(c)} bylines={await listAuthors(c.env.DB)} />)
})

/** Full-page preview of a draft, rendered with the real article template. */
adminRoutes.get('/view/:id', async (c) => {
  const article = await loadEditable(c)
  if (article instanceof Response) return article
  const story = { ...article, published_at: article.published_at ?? nowSeconds() } as PublishedStory
  const [related, briefs] = await Promise.all([
    listRelated(c.env.DB, article),
    article.format === 'brief' ? listBriefs(c.env.DB, 5, article.id) : Promise.resolve([]),
  ])
  return c.html(<ArticlePage siteUrl={c.env.SITE_URL} story={story} related={related} briefs={briefs} preview />)
})

// ---------- Article mutations ----------

adminRoutes.post('/articles', async (c) => {
  const form = await c.req.parseBody()
  const v = readValues(form)
  if (!v.title) return rerender(c, v, 'need-title')
  const { input, slugChanged } = await toInput(c, v)
  const id = await createArticle(c.env.DB, await bylineFor(c, v, c.get('author').id), input)
  if (form.intent === 'publish') {
    if (needsImage(input)) return c.redirect(`/admin/edit/${id}?msg=need-image`, 303)
    await publishArticle(c.env.DB, id)
    return c.redirect(`/admin/edit/${id}?msg=published`, 303)
  }
  return c.redirect(`/admin/edit/${id}?msg=${slugChanged ? 'slug-taken' : 'saved'}`, 303)
})

adminRoutes.post('/articles/:id', async (c) => {
  const article = await loadEditable(c)
  if (article instanceof Response) return article
  const v = readValues(await c.req.parseBody())
  if (!v.title) return rerender(c, v, 'need-title', article)
  const warn = await saveExisting(c, article, v)
  return c.redirect(`/admin/edit/${article.id}?msg=${warn ?? (article.status === 'published' ? 'updated' : 'saved')}`, 303)
})

adminRoutes.post('/articles/:id/publish', async (c) => {
  const article = await loadEditable(c)
  if (article instanceof Response) return article
  const form = await c.req.parseBody()
  let check = { format: article.format as string, image_key: article.image_key }
  if ('title' in form) {
    const v = readValues(form)
    if (!v.title) return rerender(c, v, 'need-title', article)
    await saveExisting(c, article, v)
    check = v
  }
  if (needsImage(check)) return c.redirect(`/admin/edit/${article.id}?msg=need-image`, 303)
  await publishArticle(c.env.DB, article.id)
  return c.redirect(`/admin/edit/${article.id}?msg=published`, 303)
})

adminRoutes.post('/articles/:id/unpublish', async (c) => {
  const article = await loadEditable(c)
  if (article instanceof Response) return article
  const form = await c.req.parseBody()
  if ('title' in form) {
    const v = readValues(form)
    if (v.title) await saveExisting(c, article, v)
  }
  await unpublishArticle(c.env.DB, article.id)
  return c.redirect(`/admin/edit/${article.id}?msg=unpublished`, 303)
})

// End (archive) or resume live coverage. Saves any edits in the form first.
for (const [action, ended] of [['end-live', true], ['resume-live', false]] as const) {
  adminRoutes.post(`/articles/:id/${action}`, async (c) => {
    const article = await loadEditable(c)
    if (article instanceof Response) return article
    const form = await c.req.parseBody()
    if ('title' in form) {
      const v = readValues(form)
      if (v.title) await saveExisting(c, article, v)
    }
    await setLiveEnded(c.env.DB, article.id, ended)
    return c.redirect(`/admin/edit/${article.id}?msg=${ended ? 'live-ended' : 'live-resumed'}`, 303)
  })
}

adminRoutes.post('/articles/:id/delete', async (c) => {
  if (c.get('author').role !== 'owner') return c.text('Only the owner can delete articles.', 403)
  const id = Number(c.req.param('id'))
  if (!Number.isInteger(id)) return c.notFound()
  await deleteArticle(c.env.DB, id)
  return c.redirect('/admin?msg=deleted', 303)
})

// ---------- Uploads and preview ----------

const MAX_UPLOAD = 5 * 1024 * 1024

function isWebp(b: Uint8Array) {
  const ascii = (o: number, n: number) => String.fromCharCode(...b.subarray(o, o + n))
  return b.length > 12 && ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WEBP'
}

adminRoutes.post('/upload', async (c) => {
  if ((c.req.header('Content-Type') ?? '').split(';')[0]!.trim() !== 'image/webp') {
    return c.json({ error: 'Only image/webp uploads are accepted.' }, 415)
  }
  const declared = Number(c.req.header('Content-Length') ?? 0)
  if (declared > MAX_UPLOAD) return c.json({ error: 'Image is larger than 5 MB.' }, 413)
  const bytes = new Uint8Array(await c.req.arrayBuffer())
  if (bytes.byteLength > MAX_UPLOAD) return c.json({ error: 'Image is larger than 5 MB.' }, 413)
  if (!isWebp(bytes)) return c.json({ error: 'File is not a valid WebP image.' }, 415)

  // The key is the hash of the bytes we actually received, so identical images share one object.
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  const hex = [...new Uint8Array(digest)].map((x) => x.toString(16).padStart(2, '0')).join('')
  const claimed = c.req.header('X-Content-SHA256')
  if (claimed && claimed.toLowerCase() !== hex) return c.json({ error: 'Checksum mismatch; please retry.' }, 400)
  const key = `articles/${hex}.webp`
  if (!(await c.env.IMAGES.head(key))) {
    await c.env.IMAGES.put(key, bytes, {
      httpMetadata: { contentType: 'image/webp', cacheControl: 'public, max-age=31536000, immutable' },
      customMetadata: { uploadedBy: c.get('author').email },
    })
  }
  return c.json({ key, url: `/img/${key}`, bytes: bytes.byteLength })
})

adminRoutes.post('/preview', async (c) => {
  const md = (await c.req.text()).slice(0, 200_000)
  const format = c.req.query('format') ?? 'story'
  return c.html(renderBody(isFormat(format) ? format : 'story', md).body_html)
})

// ---------- Stats ----------

const rangeOf = (c: C): Range => {
  const r = Number(c.req.query('range'))
  return (RANGES as readonly number[]).includes(r) ? (r as Range) : 30
}

async function kpisFor(db: D1Database, range: Range, articleId?: number): Promise<Kpis> {
  const now = nowSeconds()
  const [today, yesterday, cur, prev, allTime] = await Promise.all([
    totalViews(db, dayKey(now), dayKey(now), articleId),
    totalViews(db, dayKey(now, 1), dayKey(now, 1), articleId),
    totalViews(db, dayKey(now, range - 1), dayKey(now), articleId),
    totalViews(db, dayKey(now, 2 * range - 1), dayKey(now, range), articleId),
    totalViews(db, null, null, articleId),
  ])
  return { today, yesterday, range: cur, prevRange: prev, allTime }
}

adminRoutes.get('/stats', async (c) => {
  const db = c.env.DB
  const range = rangeOf(c)
  const now = nowSeconds()
  const days = lastDays(now, range)
  const [kpis, daily, top, sources, homeToday, homeRange, homeSources] = await Promise.all([
    kpisFor(db, range), dailyViews(db, days), topArticles(db, days[0]!, 25), topSources(db, days[0]!),
    pageTotal(db, 'home', dayKey(now), dayKey(now)), pageTotal(db, 'home', days[0]!, dayKey(now)), pageSources(db, 'home', days[0]!),
  ])
  const spark = lastDays(now, 14)
  const series = await seriesFor(db, top.map((t) => t.id), spark)
  return c.html(
    <StatsOverview author={c.get('author')} range={range} kpis={kpis} daily={daily} sources={sources}
      home={{ today: homeToday, range: homeRange, sources: homeSources }}
      top={top.map((t) => ({ ...t, series: series.get(t.id)! }))} />,
  )
})

adminRoutes.get('/stats.csv', async (c) => {
  const range = rangeOf(c)
  const rows = await allDaily(c.env.DB, dayKey(nowSeconds(), range - 1))
  const cell = (v: string | number) => (typeof v === 'number' ? String(v) : `"${v.replace(/"/g, '""')}"`)
  const csv = ['day,article_id,slug,title,views', ...rows.map((r) => [r.day, r.article_id, r.slug, r.title, r.views].map(cell).join(','))].join('\n')
  return c.body(csv + '\n', 200, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="views-last-${range}-days-${dayKey(nowSeconds())}.csv"`,
  })
})

adminRoutes.get('/stats/:id{[0-9]+}', async (c) => {
  const db = c.env.DB
  const article = await getById(db, Number(c.req.param('id')))
  if (!article) return c.notFound()
  const range = rangeOf(c)
  const days = lastDays(nowSeconds(), range)
  const [kpis, daily, sources] = await Promise.all([
    kpisFor(db, range, article.id), dailyViews(db, days, article.id), topSources(db, days[0]!, article.id),
  ])
  return c.html(<StatsArticle author={c.get('author')} article={article} range={range} kpis={kpis} daily={daily} sources={sources} />)
})

// ---------- Newsletter subscribers (owner only) ----------

adminRoutes.get('/subscribers', async (c) => {
  if (c.get('author').role !== 'owner') return c.redirect('/admin?msg=forbidden', 303)
  const [counts, subscribers] = await Promise.all([subscriberCounts(c.env.DB), listSubscribers(c.env.DB)])
  return c.html(<Subscribers author={c.get('author')} counts={counts} subscribers={subscribers} msg={msgOf(c)} />)
})

adminRoutes.get('/subscribers.csv', async (c) => {
  if (c.get('author').role !== 'owner') return c.redirect('/admin?msg=forbidden', 303)
  const rows = await activeSubscribers(c.env.DB)
  const cell = (v: string | number | null) => (v === null ? '' : typeof v === 'number' ? String(v) : `"${v.replace(/"/g, '""')}"`)
  const iso = (t: number | null) => (t ? new Date(t * 1000).toISOString() : null)
  const csv = [
    'email,status,signed_up,confirmed_at,terms_version,unsubscribe_token',
    ...rows.map((r) => [r.email, r.status, iso(r.created_at), iso(r.confirmed_at), r.terms_version, r.token].map(cell).join(',')),
  ].join('\n')
  return c.body(csv + '\n', 200, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="subscribers-${dayKey(nowSeconds())}.csv"`,
  })
})

adminRoutes.post('/subscribers/:id{[0-9]+}/delete', async (c) => {
  if (c.get('author').role !== 'owner') return c.redirect('/admin?msg=forbidden', 303)
  await deleteSubscriber(c.env.DB, Number(c.req.param('id')))
  return c.redirect('/admin/subscribers?msg=subscriber-deleted', 303)
})

// ---------- Profile and authors ----------

adminRoutes.get('/profile', (c) => c.html(<Profile author={c.get('author')} msg={msgOf(c)} />))

adminRoutes.post('/profile', async (c) => {
  const author = c.get('author')
  const form = await c.req.parseBody()
  const name = str(form.name, 80)
  const slug = slugify(str(form.slug, 60)).slice(0, 60)
  const bio = str(form.bio, 500)
  const title = str(form.title, 80).replace(/\s+/g, ' ')
  const draft = { ...author, name: name || author.name, slug: slug || author.slug, bio, title }
  if (!name || !slug) return c.html(<Profile author={draft} error="Name and URL are required." />, 422)
  if (await authorSlugTaken(c.env.DB, slug, author.id)) {
    return c.html(<Profile author={draft} error="That author URL is already taken." />, 422)
  }
  await updateProfile(c.env.DB, author.id, { name, slug, bio, title })
  return c.redirect('/admin/profile?msg=profile', 303)
})

adminRoutes.get('/authors', async (c) => {
  const author = c.get('author')
  if (author.role !== 'owner') return c.redirect('/admin?msg=forbidden', 303)
  return c.html(<Authors author={author} authors={await listAuthors(c.env.DB)} />)
})

// ---------- Pitches (reader tips) ----------

const PITCH_TABS = ['open', 'used', 'rejected'] as const

adminRoutes.get('/pitches', async (c) => {
  const q = c.req.query('tab')
  const tab = (PITCH_TABS as readonly string[]).includes(q ?? '') ? (q as (typeof PITCH_TABS)[number]) : 'open'
  const [pitches, counts] = await Promise.all([
    listPitches(c.env.DB, tab, c.get('author').id),
    pitchCounts(c.env.DB),
  ])
  return c.html(<Pitches author={c.get('author')} tab={tab} pitches={pitches} counts={counts} msg={msgOf(c)} />)
})

adminRoutes.post('/pitches/:id/:action', async (c) => {
  const author = c.get('author')
  const id = Number(c.req.param('id'))
  const pitch = Number.isInteger(id) ? await getPitch(c.env.DB, id) : null
  if (!pitch) return c.notFound()
  const tab = c.req.query('tab') ?? 'open'
  const back = (msg?: string) => c.redirect(`/admin/pitches?tab=${encodeURIComponent(tab)}${msg ? `&msg=${msg}` : ''}`, 303)
  // Anyone can pick up a new pitch; only the claimer (or the owner) can act on a claimed one.
  const mayAct = pitch.status === 'new' || pitch.claimed_by === author.id || author.role === 'owner'

  switch (c.req.param('action')) {
    case 'vote':
      await toggleVote(c.env.DB, id, author.id)
      return back()
    case 'claim':
      if (pitch.status !== 'new') return back('pitch-taken')
      await setPitchStatus(c.env.DB, id, 'claimed', author.id)
      return back('pitch-claimed')
    case 'unclaim':
      if (!mayAct) return back('forbidden')
      await setPitchStatus(c.env.DB, id, 'new', null)
      return back()
    case 'reject':
      if (!mayAct) return back('forbidden')
      await setPitchStatus(c.env.DB, id, 'rejected', pitch.claimed_by)
      return back('pitch-rejected')
    case 'reopen':
      await setPitchStatus(c.env.DB, id, 'new', null)
      return back()
    case 'delete':
      if (author.role !== 'owner') return back('forbidden')
      await deletePitch(c.env.DB, id)
      return back('pitch-deleted')
    case 'draft': {
      if (!mayAct) return back('forbidden')
      const isHeadline = pitch.kind === 'headline'
      const title = isHeadline ? pitch.body.split('\n')[0]!.slice(0, 200) : 'Untitled (from a reader tip)'
      const body_md = isHeadline && !pitch.body.includes('\n') ? '' : `> Tip: ${pitch.body.replace(/\n/g, '\n> ')}\n\n`
      const articleId = await createArticle(c.env.DB, author.id, {
        slug: await uniqueSlug(c.env.DB, slugify(isHeadline ? title : `tip-${pitch.id}`)),
        title,
        dek: '',
        section: emptyValues.section,
        body_md,
        ...renderBody('story', body_md),
        format: 'story',
        image_key: '',
        image_alt: '',
        image_credit: '',
        label: '',
        dateline: '',
        share_key: '',
        share_for: '',
        featured: 0,
      })
      await setPitchStatus(c.env.DB, id, 'used', author.id, articleId)
      return c.redirect(`/admin/edit/${articleId}?msg=from-pitch`, 303)
    }
    default:
      return c.notFound()
  }
})
