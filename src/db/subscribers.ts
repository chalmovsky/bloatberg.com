// Newsletter sign-ups. Stores only what's needed to send the newsletter and honor unsubscribes.

/** Bump when the newsletter terms change; each sign-up records the version it agreed to. */
export const NEWSLETTER_TERMS_VERSION = '2026-11-01b'

export interface Subscriber {
  id: number
  email: string
  status: 'pending' | 'confirmed' | 'unsubscribed'
  token: string
  terms_version: string
  created_at: number
  confirmed_at: number | null
  unsubscribed_at: number | null
}

export const normalizeEmail = (raw: string) => raw.trim().toLowerCase()

/** Deliberately simple: something@something.tld, no spaces, at most 254 characters. */
export const isEmail = (s: string) => s.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s)

const newToken = () => [...crypto.getRandomValues(new Uint8Array(24))].map((b) => b.toString(16).padStart(2, '0')).join('')

export async function recentSignupsFromIp(db: D1Database, ipHash: string, seconds: number) {
  const row = await db
    .prepare('SELECT COUNT(*) AS n FROM subscribers WHERE ip_hash = ? AND created_at > unixepoch() - ?')
    .bind(ipHash, seconds)
    .first<{ n: number }>()
  return row?.n ?? 0
}

/** New sign-up (subscribed straight away; there's no confirmation step), or a returning address that had unsubscribed. */
export async function subscribe(db: D1Database, email: string, ipHash: string) {
  await db
    .prepare(
      `INSERT INTO subscribers (email, status, confirmed_at, token, terms_version, ip_hash)
       VALUES (?, 'confirmed', unixepoch(), ?, ?, ?)
       ON CONFLICT (email) DO UPDATE SET
         status = 'confirmed', token = excluded.token, terms_version = excluded.terms_version,
         created_at = unixepoch(), confirmed_at = unixepoch(), unsubscribed_at = NULL
       WHERE subscribers.status = 'unsubscribed'`,
    )
    .bind(email, newToken(), NEWSLETTER_TERMS_VERSION, ipHash)
    .run()
}

export function getByToken(db: D1Database, token: string) {
  return db.prepare('SELECT * FROM subscribers WHERE token = ?').bind(token).first<Subscriber>()
}

export async function unsubscribe(db: D1Database, token: string) {
  const r = await db
    .prepare(`UPDATE subscribers SET status = 'unsubscribed', unsubscribed_at = unixepoch() WHERE token = ? AND status != 'unsubscribed'`)
    .bind(token)
    .run()
  return r.meta.changes > 0
}

export async function subscriberCounts(db: D1Database) {
  const { results } = await db.prepare('SELECT status, COUNT(*) AS n FROM subscribers GROUP BY status').all<{ status: string; n: number }>()
  const by = Object.fromEntries(results.map((r) => [r.status, r.n]))
  return { pending: by.pending ?? 0, confirmed: by.confirmed ?? 0, unsubscribed: by.unsubscribed ?? 0 }
}

export async function listSubscribers(db: D1Database, limit = 500) {
  const { results } = await db.prepare('SELECT * FROM subscribers ORDER BY created_at DESC LIMIT ?').bind(limit).all<Subscriber>()
  return results
}

/** Everyone who should get the newsletter (pending + confirmed), for exporting to an email service. */
export async function activeSubscribers(db: D1Database) {
  const { results } = await db
    .prepare(`SELECT * FROM subscribers WHERE status != 'unsubscribed' ORDER BY created_at`)
    .all<Subscriber>()
  return results
}

export async function deleteSubscriber(db: D1Database, id: number) {
  await db.prepare('DELETE FROM subscribers WHERE id = ?').bind(id).run()
}
