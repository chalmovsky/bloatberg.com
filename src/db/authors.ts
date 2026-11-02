import { slugify } from '../lib/slug'

export interface Author {
  id: number
  email: string
  name: string
  slug: string
  bio: string
  title: string
  role: 'owner' | 'editor'
  created_at: number
}

export async function getAuthorBySlug(db: D1Database, slug: string) {
  return db.prepare('SELECT * FROM authors WHERE slug = ?').bind(slug).first<Author>()
}

export async function getAuthorById(db: D1Database, id: number) {
  return db.prepare('SELECT * FROM authors WHERE id = ?').bind(id).first<Author>()
}

export async function getAuthorByEmail(db: D1Database, email: string) {
  return db.prepare('SELECT * FROM authors WHERE email = ?').bind(email).first<Author>()
}

export async function listAuthors(db: D1Database) {
  const { results } = await db
    .prepare(
      `SELECT a.*, (SELECT COUNT(*) FROM articles WHERE author_id = a.id) AS article_count
       FROM authors a ORDER BY a.role = 'owner' DESC, a.name`,
    )
    .all<Author & { article_count: number }>()
  return results
}

export async function authorSlugTaken(db: D1Database, slug: string, exceptId?: number) {
  const row = await db
    .prepare('SELECT id FROM authors WHERE slug = ? AND id != ?')
    .bind(slug, exceptId ?? -1)
    .first()
  return row !== null
}

async function uniqueAuthorSlug(db: D1Database, base: string) {
  let slug = base || 'staff'
  for (let n = 2; await authorSlugTaken(db, slug); n++) slug = `${base}-${n}`
  return slug
}

/** Find the author for an Access email, creating them on first sight. */
export async function upsertAuthor(db: D1Database, email: string, ownerEmail: string): Promise<Author> {
  const existing = await getAuthorByEmail(db, email)
  const shouldBeOwner = email === ownerEmail.trim().toLowerCase()
  if (existing) {
    if (shouldBeOwner && existing.role !== 'owner') {
      await db.prepare("UPDATE authors SET role = 'owner' WHERE id = ?").bind(existing.id).run()
      existing.role = 'owner'
    }
    return existing
  }
  const name = email.split('@')[0]
  const slug = await uniqueAuthorSlug(db, slugify(name))
  const row = await db
    .prepare('INSERT INTO authors (email, name, slug, role) VALUES (?, ?, ?, ?) RETURNING *')
    .bind(email, name, slug, shouldBeOwner ? 'owner' : 'editor')
    .first<Author>()
  return row!
}

export async function updateProfile(
  db: D1Database,
  id: number,
  data: { name: string; slug: string; bio: string; title: string },
) {
  await db
    .prepare('UPDATE authors SET name = ?, slug = ?, bio = ?, title = ? WHERE id = ?')
    .bind(data.name, data.slug, data.bio, data.title, id)
    .run()
}
