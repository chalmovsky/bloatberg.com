export type PitchKind = 'headline' | 'observation'
export type PitchStatus = 'new' | 'claimed' | 'used' | 'rejected'

export interface Pitch {
  id: number
  kind: PitchKind
  body: string
  status: PitchStatus
  claimed_by: number | null
  article_id: number | null
  created_at: number
}

export interface PitchRow extends Pitch {
  votes: number
  voted: number // 1 if the viewing author has voted
  claimer_name: string | null
}

export async function recentFromIp(db: D1Database, ipHash: string, sinceSeconds: number) {
  const row = await db
    .prepare('SELECT COUNT(*) AS n FROM pitches WHERE ip_hash = ? AND created_at > unixepoch() - ?')
    .bind(ipHash, sinceSeconds)
    .first<{ n: number }>()
  return row?.n ?? 0
}

export async function createPitch(db: D1Database, kind: PitchKind, body: string, ipHash: string) {
  await db.prepare('INSERT INTO pitches (kind, body, ip_hash) VALUES (?, ?, ?)').bind(kind, body, ipHash).run()
}

export async function listPitches(db: D1Database, status: PitchStatus | 'open', authorId: number) {
  // "open" = new + claimed, sorted by votes, then newest.
  const where = status === 'open' ? "p.status IN ('new','claimed')" : 'p.status = ?'
  const stmt = db.prepare(
    `SELECT p.id, p.kind, p.body, p.status, p.claimed_by, p.article_id, p.created_at,
       (SELECT COUNT(*) FROM pitch_votes v WHERE v.pitch_id = p.id) AS votes,
       EXISTS (SELECT 1 FROM pitch_votes v WHERE v.pitch_id = p.id AND v.author_id = ?) AS voted,
       a.name AS claimer_name
     FROM pitches p LEFT JOIN authors a ON a.id = p.claimed_by
     WHERE ${where}
     ORDER BY votes DESC, p.created_at DESC
     LIMIT 200`,
  )
  const { results } = await (status === 'open' ? stmt.bind(authorId) : stmt.bind(authorId, status)).all<PitchRow>()
  return results
}

export async function pitchCounts(db: D1Database) {
  const { results } = await db
    .prepare('SELECT status, COUNT(*) AS n FROM pitches GROUP BY status')
    .all<{ status: PitchStatus; n: number }>()
  const counts: Record<PitchStatus, number> = { new: 0, claimed: 0, used: 0, rejected: 0 }
  for (const r of results) counts[r.status] = r.n
  return counts
}

export function getPitch(db: D1Database, id: number) {
  return db.prepare('SELECT * FROM pitches WHERE id = ?').bind(id).first<Pitch>()
}

export async function toggleVote(db: D1Database, pitchId: number, authorId: number) {
  const del = await db.prepare('DELETE FROM pitch_votes WHERE pitch_id = ? AND author_id = ?').bind(pitchId, authorId).run()
  if (del.meta.changes === 0) {
    await db.prepare('INSERT OR IGNORE INTO pitch_votes (pitch_id, author_id) VALUES (?, ?)').bind(pitchId, authorId).run()
  }
}

export async function setPitchStatus(
  db: D1Database,
  id: number,
  status: PitchStatus,
  claimedBy: number | null,
  articleId?: number,
) {
  await db
    .prepare('UPDATE pitches SET status = ?, claimed_by = ?, article_id = COALESCE(?, article_id) WHERE id = ?')
    .bind(status, claimedBy, articleId ?? null, id)
    .run()
}

export async function deletePitch(db: D1Database, id: number) {
  await db.prepare('DELETE FROM pitches WHERE id = ?').bind(id).run()
}
