import type { ArticleFormat } from '../db/articles'
import { renderLive } from './live'
import { reviewScore } from './embeds'
import { readMinutes, renderMarkdown } from './markdown'

/** The score from the first review box in the body, if there is one. */
function scoreOf(md: string) {
  const m = /^\s*```review\s*\n([\s\S]*?)^\s*```/m.exec(md)
  return m ? reviewScore(m[1]!) : null
}

/** Everything derived from the Markdown body, computed once on save. */
export function renderBody(format: ArticleFormat, md: string) {
  if (format === 'live') {
    const live = renderLive(md, renderMarkdown)
    return { body_html: live.html, read_minutes: readMinutes(md), live_latest: live.latest, live_count: live.count, review_score: scoreOf(md) }
  }
  return { body_html: renderMarkdown(md), read_minutes: readMinutes(md), live_latest: '', live_count: 0, review_score: scoreOf(md) }
}

export const FORMATS: { value: ArticleFormat; label: string; hint: string }[] = [
  { value: 'story', label: 'Story', hint: 'A regular article with a picture.' },
  { value: 'live', label: 'Live updates', hint: 'Timestamped updates, newest first, each with its own headline.' },
  { value: 'brief', label: 'In Brief', hint: 'Headline only. No picture needed; a short body is optional.' },
]

export const isFormat = (s: string): s is ArticleFormat => FORMATS.some((f) => f.value === s)
