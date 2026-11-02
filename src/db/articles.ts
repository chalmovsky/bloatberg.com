import { dateParts } from '../lib/dates'
import { dayKey } from './views'

export type ArticleFormat = 'story' | 'live' | 'brief'

export interface Article {
  id: number
  format: ArticleFormat
  live_latest: string
  live_count: number
  live_ended_at: number | null // set when live coverage is ended (archived)
  review_score: number | null // from the review box, 0–10
  share_key: string // 1200×630 share card (R2 key or /placeholder/share/ path)
  share_for: string // signature of what the card shows; the editor regenerates it when this changes
  slug: string
  title: string
  dek: string
  section: string
  body_md: string
  body_html: string
  read_minutes: number
  image_key: string
  image_alt: string
  image_credit: string
  label: string
  dateline: string
  featured: number
  status: 'draft' | 'published'
  author_id: number
  published_at: number | null
  created_at: number
  updated_at: number
}

/** Article joined with its author's byline fields. */
export interface Story extends Article {
  author_name: string
  author_slug: string
  author_bio: string
  author_title: string
}

export interface PublishedStory extends Story {
  published_at: number
}

export type ArticleInput = Pick<
  Article,
  | 'slug' | 'title' | 'dek' | 'section' | 'body_md' | 'body_html' | 'read_minutes' | 'image_key' | 'image_alt'
  | 'image_credit' | 'featured' | 'format' | 'live_latest' | 'live_count' | 'label' | 'dateline' | 'review_score' | 'share_key' | 'share_for'
>

const SELECT_STORY = `
  SELECT ar.*, au.name AS author_name, au.slug AS author_slug, au.bio AS author_bio, au.title AS author_title
  FROM articles ar JOIN authors au ON au.id = ar.author_id`

const PUBLISHED = `ar.status = 'published' AND ar.published_at IS NOT NULL`
const NOT_BRIEF = `ar.format != 'brief'`
/** Fronts sort live coverage by its latest update (or when it ended), so active coverage rises to the top. */
const FRESHNESS = `(CASE WHEN ar.format = 'live' THEN COALESCE(ar.live_ended_at, ar.updated_at) ELSE ar.published_at END)`

export function articlePath(a: { slug: string; published_at: number | null }): string {
  if (!a.published_at) return '#'
  const [y, m, d] = dateParts(a.published_at)
  return `/${y}/${m}/${d}/${a.slug}`
}

/** R2 keys are served from /img; seeded placeholders (leading slash) from static assets. */
export const isLiveNow = (
  a: Pick<Article, 'format' | 'updated_at'> & { live_ended_at?: number | null },
  now = Math.floor(Date.now() / 1000),
) => a.format === 'live' && !a.live_ended_at && now - a.updated_at < 86400

/** Live coverage that an editor has ended. Its updates stay; it just isn't live any more. */
export const isLiveEnded = (a: { format: string; live_ended_at?: number | null }) => a.format === 'live' && !!a.live_ended_at

/** What a shared link shows: the share card (headline + picture), else the picture, else the site card. */
export const shareImage = (a: Pick<Article, 'image_key' | 'share_key'>) =>
  a.share_key ? imageUrl(a.share_key) : a.image_key ? imageUrl(a.image_key) : '/og-default.png'

export function imageUrl(key: string): string {
  if (!key) return ''
  return key.startsWith('/') ? key : `/img/${key}`
}

/** Accepts R2 content-hash keys and seeded static paths (/placeholder/…, /placeholder/share/…). */
export const isImageKey = (k: string) =>
  /^articles\/[a-f0-9]{64}\.webp$/.test(k) || /^\/placeholder\/(?:share\/)?[\w.-]+$/.test(k)

async function all<T>(stmt: D1PreparedStatement) {
  const { results } = await stmt.all<T>()
  return results
}

// ---------- Public reads ----------

/** Everything published, newest first (feeds, sitemap, 404). */
export function listPublished(db: D1Database, limit: number, offset = 0) {
  return all<PublishedStory>(
    db.prepare(`${SELECT_STORY} WHERE ${PUBLISHED} ORDER BY ar.published_at DESC LIMIT ? OFFSET ?`).bind(limit, offset),
  )
}

/** Stories and live coverage — everything that has a picture and a page — without briefs. */
export function listStories(db: D1Database, limit: number) {
  return all<PublishedStory>(
    db.prepare(`${SELECT_STORY} WHERE ${PUBLISHED} AND ${NOT_BRIEF} ORDER BY ${FRESHNESS} DESC LIMIT ?`).bind(limit),
  )
}

export function listBriefs(db: D1Database, limit: number, excludeId = -1) {
  return all<PublishedStory>(
    db
      .prepare(`${SELECT_STORY} WHERE ${PUBLISHED} AND ar.format = 'brief' AND ar.id != ? ORDER BY ar.published_at DESC LIMIT ?`)
      .bind(excludeId, limit),
  )
}

/** Newest published featured article, falling back to the newest published article. */
export async function getLead(db: D1Database) {
  return db
    .prepare(`${SELECT_STORY} WHERE ${PUBLISHED} AND ${NOT_BRIEF} ORDER BY ar.featured DESC, ${FRESHNESS} DESC LIMIT 1`)
    .first<PublishedStory>()
}

/**
 * "Most read": stories ranked by views over the last `days` days (default: today and yesterday).
 * With little or no traffic, featured and newer stories fill the remaining places.
 */
export function listMostRead(db: D1Database, limit = 5, days = 2) {
  const since = dayKey(Math.floor(Date.now() / 1000), days - 1)
  return all<PublishedStory>(
    db
      .prepare(
        `SELECT ar.*, au.name AS author_name, au.slug AS author_slug, au.bio AS author_bio, au.title AS author_title
         FROM articles ar JOIN authors au ON au.id = ar.author_id
         LEFT JOIN (SELECT article_id, SUM(views) AS views FROM article_views WHERE day >= ? GROUP BY article_id) v
           ON v.article_id = ar.id
         WHERE ${PUBLISHED} AND ${NOT_BRIEF}
         ORDER BY COALESCE(v.views, 0) DESC, ar.featured DESC, ar.published_at DESC LIMIT ?`,
      )
      .bind(since, limit),
  )
}

export function listBySection(db: D1Database, section: string, limit = 30) {
  return all<PublishedStory>(
    db
      .prepare(`${SELECT_STORY} WHERE ${PUBLISHED} AND ar.section = ? ORDER BY ar.published_at DESC LIMIT ?`)
      .bind(section, limit),
  )
}

export function listByAuthor(db: D1Database, authorId: number, limit = 50) {
  return all<PublishedStory>(
    db
      .prepare(`${SELECT_STORY} WHERE ${PUBLISHED} AND ar.author_id = ? ORDER BY ar.published_at DESC LIMIT ?`)
      .bind(authorId, limit),
  )
}

export function getPublishedBySlug(db: D1Database, slug: string) {
  return db.prepare(`${SELECT_STORY} WHERE ${PUBLISHED} AND ar.slug = ?`).bind(slug).first<PublishedStory>()
}

/** Same section first, then anything recent, to always fill three slots. */
export function listRelated(db: D1Database, article: Article, limit = 3) {
  return all<PublishedStory>(
    db
      .prepare(
        `${SELECT_STORY} WHERE ${PUBLISHED} AND ${NOT_BRIEF} AND ar.id != ?
         ORDER BY (ar.section = ?) DESC, ar.published_at DESC LIMIT ?`,
      )
      .bind(article.id, article.section, limit),
  )
}

// ---------- Admin ----------

export function getById(db: D1Database, id: number) {
  return db.prepare(`${SELECT_STORY} WHERE ar.id = ?`).bind(id).first<Story>()
}

export function getAnyBySlug(db: D1Database, slug: string) {
  return db.prepare(`${SELECT_STORY} WHERE ar.slug = ?`).bind(slug).first<Story>()
}

export function listAdmin(db: D1Database) {
  return all<Story>(
    db.prepare(
      `${SELECT_STORY} ORDER BY ar.status = 'draft' DESC, COALESCE(ar.published_at, ar.updated_at) DESC, ar.id DESC`,
    ),
  )
}

export async function slugTaken(db: D1Database, slug: string, exceptId?: number) {
  const row = await db
    .prepare('SELECT id FROM articles WHERE slug = ? AND id != ?')
    .bind(slug, exceptId ?? -1)
    .first()
  return row !== null
}

export async function uniqueSlug(db: D1Database, base: string, exceptId?: number) {
  const root = base || 'untitled'
  let slug = root
  for (let n = 2; await slugTaken(db, slug, exceptId); n++) slug = `${root.slice(0, 76)}-${n}`
  return slug
}

export async function createArticle(db: D1Database, authorId: number, input: ArticleInput) {
  const row = await db
    .prepare(
      `INSERT INTO articles (slug, title, dek, section, body_md, body_html, read_minutes,
         image_key, image_alt, image_credit, featured, format, live_latest, live_count, label, dateline, review_score, share_key, share_for, author_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
    )
    .bind(
      input.slug, input.title, input.dek, input.section, input.body_md, input.body_html, input.read_minutes,
      input.image_key, input.image_alt, input.image_credit, input.featured, input.format, input.live_latest,
      input.live_count, input.label, input.dateline, input.review_score, input.share_key, input.share_for, authorId,
    )
    .first<{ id: number }>()
  return row!.id
}

export async function updateArticle(db: D1Database, id: number, input: ArticleInput) {
  await db
    .prepare(
      `UPDATE articles SET slug = ?, title = ?, dek = ?, section = ?, body_md = ?, body_html = ?,
         read_minutes = ?, image_key = ?, image_alt = ?, image_credit = ?, featured = ?,
         format = ?, live_latest = ?, live_count = ?, label = ?, dateline = ?, review_score = ?, share_key = ?, share_for = ?, updated_at = unixepoch()
       WHERE id = ?`,
    )
    .bind(
      input.slug, input.title, input.dek, input.section, input.body_md, input.body_html, input.read_minutes,
      input.image_key, input.image_alt, input.image_credit, input.featured, input.format, input.live_latest,
      input.live_count, input.label, input.dateline, input.review_score, input.share_key, input.share_for, id,
    )
    .run()
}

/** Changes the byline. */
export async function setArticleAuthor(db: D1Database, id: number, authorId: number) {
  await db.prepare('UPDATE articles SET author_id = ? WHERE id = ?').bind(authorId, id).run()
}

/** First publish sets published_at; republishing keeps the original date. */
export async function publishArticle(db: D1Database, id: number) {
  await db
    .prepare(
      `UPDATE articles SET status = 'published',
         published_at = COALESCE(published_at, unixepoch()), updated_at = unixepoch()
       WHERE id = ?`,
    )
    .bind(id)
    .run()
}

/** End (archive) live coverage, or resume it. Doesn't touch updated_at, so the story doesn't jump. */
export async function setLiveEnded(db: D1Database, id: number, ended: boolean) {
  await db
    .prepare(`UPDATE articles SET live_ended_at = ${ended ? 'unixepoch()' : 'NULL'} WHERE id = ? AND format = 'live'`)
    .bind(id)
    .run()
}

export async function unpublishArticle(db: D1Database, id: number) {
  await db.prepare(`UPDATE articles SET status = 'draft', updated_at = unixepoch() WHERE id = ?`).bind(id).run()
}

export async function deleteArticle(db: D1Database, id: number) {
  await db.prepare('DELETE FROM articles WHERE id = ?').bind(id).run()
}

// ---------- Fronts ----------

/** Live coverage updated in the last 24 hours, for the alert bar. */
export function getActiveLive(db: D1Database) {
  return db
    .prepare(`${SELECT_STORY} WHERE ${PUBLISHED} AND ar.format = 'live' AND ar.live_ended_at IS NULL AND ar.updated_at > unixepoch() - 86400
              ORDER BY ar.updated_at DESC LIMIT 1`)
    .first<PublishedStory>()
}

/** Simple search over headlines, subheadlines and bodies. */
export function searchPublished(db: D1Database, q: string, limit = 40) {
  const like = `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`
  return all<PublishedStory>(
    db
      .prepare(
        `${SELECT_STORY} WHERE ${PUBLISHED} AND (ar.title LIKE ?1 ESCAPE '\\' OR ar.dek LIKE ?1 ESCAPE '\\' OR ar.body_md LIKE ?1 ESCAPE '\\')
         ORDER BY (ar.title LIKE ?1 ESCAPE '\\') DESC, ar.published_at DESC LIMIT ?2`,
      )
      .bind(like, limit),
  )
}
