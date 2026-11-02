// Anonymous page-view counting and the queries behind the CMS stats pages.
// Stored per article per day (site timezone). No IPs, cookies or user identifiers.
import { dateParts } from '../lib/dates'

/** "2026-11-01" in the site timezone, `back` days before `ts`. Calendar math, so DST can't skip a day. */
export function dayKey(ts: number, back = 0): string {
  const [y, m, d] = dateParts(ts).map(Number) as [number, number, number]
  return new Date(Date.UTC(y, m - 1, d - back)).toISOString().slice(0, 10)
}

/** The last `n` day keys, oldest first, ending today. */
export function lastDays(ts: number, n: number): string[] {
  return Array.from({ length: n }, (_, i) => dayKey(ts, n - 1 - i))
}

// ---------- Counting ----------

const BOTS =
  /bot|crawl|spider|slurp|preview|fetch|scrape|monitor|uptime|lighthouse|headless|phantom|curl|wget|python|httpx|go-http|java\/|okhttp|axios|node-fetch|undici|facebookexternalhit|embedly|whatsapp|telegram|discord|slack|skype|vkshare|pinterest|bitly|quora link|outbrain|feed|rss|validator/i

/** Real readers only: no bots or link unfurlers, no prefetches, no logged-in editors. */
export function isCountable(req: Request): boolean {
  if (req.method !== 'GET') return false
  const ua = req.headers.get('User-Agent') ?? ''
  if (!ua || BOTS.test(ua)) return false
  const purpose = req.headers.get('Sec-Purpose') ?? req.headers.get('Purpose') ?? ''
  if (/prefetch|prerender/i.test(purpose)) return false
  // Editors signed in through Cloudflare Access carry this cookie on the whole domain.
  if (/(?:^|;\s*)CF_Authorization=/.test(req.headers.get('Cookie') ?? '')) return false
  return true
}

const SITE_PAGES: [RegExp, string][] = [
  [/^\/$/, 'Front page'],
  [/^\/section\//, 'Section pages'],
  [/^\/\d{4}\/\d{2}\/\d{2}\//, 'Other articles'],
  [/^\/briefs/, 'In Brief page'],
  [/^\/search/, 'Search'],
  [/^\/author\//, 'Author pages'],
]

const ALIASES: Record<string, string> = {
  't.co': 'x.com',
  'twitter.com': 'x.com',
  'l.facebook.com': 'facebook.com',
  'lm.facebook.com': 'facebook.com',
  'm.facebook.com': 'facebook.com',
  'out.reddit.com': 'reddit.com',
  'old.reddit.com': 'reddit.com',
  'lnkd.in': 'linkedin.com',
  'com.google.android.gm': 'Gmail app',
}

/** Where a view came from: a referring site's host, one of our own pages, or "Direct". */
export function sourceOf(req: Request): string {
  const ref = req.headers.get('Referer')
  if (!ref) return 'Direct'
  let url: URL
  try {
    url = new URL(ref)
  } catch {
    return 'Direct'
  }
  if (url.host === new URL(req.url).host) {
    return SITE_PAGES.find(([re]) => re.test(url.pathname))?.[1] ?? 'Other site pages'
  }
  if (url.protocol === 'android-app:') return ALIASES[url.host] ?? url.host
  const host = url.hostname.replace(/^www\./, '').toLowerCase()
  if (/^(?:[a-z]+\.)?google\.[a-z.]+$/.test(host)) return 'Google'
  if (/(?:^|\.)bing\.com$/.test(host)) return 'Bing'
  if (/(?:^|\.)duckduckgo\.com$/.test(host)) return 'DuckDuckGo'
  return (ALIASES[host] ?? host).slice(0, 80)
}

export async function recordView(db: D1Database, articleId: number, source: string, now: number) {
  const day = dayKey(now)
  await db.batch([
    db
      .prepare(
        `INSERT INTO article_views (article_id, day, views) VALUES (?, ?, 1)
         ON CONFLICT (article_id, day) DO UPDATE SET views = views + 1`,
      )
      .bind(articleId, day),
    db
      .prepare(
        `INSERT INTO article_sources (article_id, day, source, views) VALUES (?, ?, ?, 1)
         ON CONFLICT (article_id, day, source) DO UPDATE SET views = views + 1`,
      )
      .bind(articleId, day, source),
  ])
}

/** Counts a visit to a page that isn't an article (the front page). */
export async function recordPageView(db: D1Database, page: string, source: string, now: number) {
  const day = dayKey(now)
  await db.batch([
    db
      .prepare(
        `INSERT INTO page_views (page, day, views) VALUES (?, ?, 1)
         ON CONFLICT (page, day) DO UPDATE SET views = views + 1`,
      )
      .bind(page, day),
    db
      .prepare(
        `INSERT INTO page_sources (page, day, source, views) VALUES (?, ?, ?, 1)
         ON CONFLICT (page, day, source) DO UPDATE SET views = views + 1`,
      )
      .bind(page, day, source),
  ])
}

// ---------- Reading ----------

async function all<T>(stmt: D1PreparedStatement) {
  const { results } = await stmt.all<T>()
  return results
}

/** Daily totals between two days (inclusive), optionally for one article. Missing days are zero. */
export async function dailyViews(db: D1Database, days: string[], articleId?: number) {
  const rows = await all<{ day: string; views: number }>(
    db
      .prepare(
        `SELECT day, SUM(views) AS views FROM article_views
         WHERE day BETWEEN ?1 AND ?2 AND (?3 IS NULL OR article_id = ?3) GROUP BY day`,
      )
      .bind(days[0], days[days.length - 1], articleId ?? null),
  )
  const by = new Map(rows.map((r) => [r.day, r.views]))
  return days.map((day) => ({ day, views: by.get(day) ?? 0 }))
}

export async function totalViews(db: D1Database, from: string | null, to: string | null, articleId?: number) {
  const row = await db
    .prepare(
      `SELECT COALESCE(SUM(views), 0) AS views FROM article_views
       WHERE (?1 IS NULL OR day >= ?1) AND (?2 IS NULL OR day <= ?2) AND (?3 IS NULL OR article_id = ?3)`,
    )
    .bind(from, to, articleId ?? null)
    .first<{ views: number }>()
  return row?.views ?? 0
}

export interface TopRow {
  id: number
  title: string
  slug: string
  section: string
  format: string
  published_at: number | null
  author_name: string
  views: number
}

export function topArticles(db: D1Database, from: string, limit = 25) {
  return all<TopRow>(
    db
      .prepare(
        `SELECT ar.id, ar.title, ar.slug, ar.section, ar.format, ar.published_at, au.name AS author_name, SUM(v.views) AS views
         FROM article_views v JOIN articles ar ON ar.id = v.article_id JOIN authors au ON au.id = ar.author_id
         WHERE v.day >= ? GROUP BY ar.id ORDER BY views DESC, ar.published_at DESC LIMIT ?`,
      )
      .bind(from, limit),
  )
}

/** Per-day views for a set of articles, for sparklines. */
export async function seriesFor(db: D1Database, ids: number[], days: string[]) {
  const out = new Map<number, number[]>(ids.map((id) => [id, days.map(() => 0)]))
  if (!ids.length) return out
  const rows = await all<{ article_id: number; day: string; views: number }>(
    db
      .prepare(
        `SELECT article_id, day, views FROM article_views
         WHERE day >= ? AND article_id IN (${ids.map(() => '?').join(',')})`,
      )
      .bind(days[0], ...ids),
  )
  const idx = new Map(days.map((d, i) => [d, i]))
  for (const r of rows) {
    const i = idx.get(r.day)
    if (i !== undefined) out.get(r.article_id)![i] = r.views
  }
  return out
}

export function topSources(db: D1Database, from: string, articleId?: number, limit = 12) {
  return all<{ source: string; views: number }>(
    db
      .prepare(
        `SELECT source, SUM(views) AS views FROM article_sources
         WHERE day >= ?1 AND (?2 IS NULL OR article_id = ?2) GROUP BY source ORDER BY views DESC LIMIT ?3`,
      )
      .bind(from, articleId ?? null, limit),
  )
}

/** All-time and 7-day totals per article, for the article list. */
export async function viewsByArticle(db: D1Database, weekFrom: string) {
  const rows = await all<{ article_id: number; total: number; week: number }>(
    db
      .prepare(
        `SELECT article_id, SUM(views) AS total, COALESCE(SUM(CASE WHEN day >= ? THEN views END), 0) AS week
         FROM article_views GROUP BY article_id`,
      )
      .bind(weekFrom),
  )
  return new Map(rows.map((r) => [r.article_id, r]))
}

/** Every row, for the CSV export. */
export function allDaily(db: D1Database, from: string) {
  return all<{ day: string; article_id: number; slug: string; title: string; views: number }>(
    db
      .prepare(
        `SELECT v.day, v.article_id, ar.slug, ar.title, v.views FROM article_views v JOIN articles ar ON ar.id = v.article_id
         WHERE v.day >= ? ORDER BY v.day DESC, v.views DESC`,
      )
      .bind(from),
  )
}

/** Visits to a non-article page between two days (inclusive). */
export async function pageTotal(db: D1Database, page: string, from: string, to: string) {
  const row = await db
    .prepare('SELECT COALESCE(SUM(views), 0) AS views FROM page_views WHERE page = ? AND day BETWEEN ? AND ?')
    .bind(page, from, to)
    .first<{ views: number }>()
  return row?.views ?? 0
}

/** Where visitors to a non-article page came from, since `from`. */
export function pageSources(db: D1Database, page: string, from: string, limit = 12) {
  return all<{ source: string; views: number }>(
    db
      .prepare(
        `SELECT source, SUM(views) AS views FROM page_sources
         WHERE page = ? AND day >= ? GROUP BY source ORDER BY views DESC LIMIT ?`,
      )
      .bind(page, from, limit),
  )
}
