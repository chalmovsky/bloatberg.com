// "Artifact" embeds: fenced code blocks in an article's Markdown that render as a
// forum thread, issue, changelog, team chat, status-page incident or leaked memo.
//
//   ```thread
//   title: Ask: how do I center a div?
//   points: 412
//
//   @throwaway_css · 4 hours ago
//   Comment text, **Markdown** allowed.
//
//     @replier · 3 hours ago
//     Replies are indented two spaces per level.
//   ```
//
// Shared syntax, everywhere:
//   key: value      lines at the very top are settings (until the first blank line)
//   @name · meta    starts an entry (a comment, a message, a status update)
//   + 👍 12 · 😬 3  reactions for the entry above
//   ! text          a timeline event (issues only), e.g. "! @maintainer closed this"
//
// Everything is rendered once, on save, like the rest of the body.

type Md = (src: string) => string

export const EMBED_KINDS = ['thread', 'issue', 'changelog', 'chat', 'incident', 'memo', 'review', 'quote'] as const
export type EmbedKind = (typeof EMBED_KINDS)[number]

export const isEmbedKind = (s: string | undefined): s is EmbedKind =>
  !!s && (EMBED_KINDS as readonly string[]).includes(s)

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

/** Inline Markdown without the wrapping <p>, for one-line fields. */
const inline = (md: Md, s: string) => md(s).trim().replace(/^<p>([\s\S]*)<\/p>$/, '$1')

// ---------- Parsing ----------

interface Entry {
  type: 'entry' | 'event'
  depth: number
  name: string
  meta: string
  body: string[]
  reactions: string
}

interface Parsed {
  meta: Record<string, string>
  intro: string
  entries: Entry[]
}

function parse(src: string): Parsed {
  const lines = src.replace(/\r\n/g, '\n').split('\n')
  const meta: Record<string, string> = {}
  let i = 0
  while (i < lines.length && /^[a-z_]+:\s*/i.test(lines[i]!) && !/^\s*@/.test(lines[i]!)) {
    const m = /^([a-z_]+):\s*(.*)$/i.exec(lines[i]!)!
    meta[m[1]!.toLowerCase()] = m[2]!.trim()
    i++
  }
  const intro: string[] = []
  const entries: Entry[] = []
  let cur: Entry | undefined
  for (; i < lines.length; i++) {
    const line = lines[i]!
    const head = /^( *)@(\S+)(?:\s*[·|•—-]\s*(.*))?$/.exec(line)
    const event = /^( *)!\s+(.*)$/.exec(line)
    const react = /^( *)\+\s+(.*)$/.exec(line)
    if (head) {
      cur = { type: 'entry', depth: Math.floor(head[1]!.length / 2), name: head[2]!, meta: (head[3] ?? '').trim(), body: [], reactions: '' }
      entries.push(cur)
    } else if (event) {
      entries.push({ type: 'event', depth: 0, name: '', meta: event[2]!.trim(), body: [], reactions: '' })
      cur = undefined
    } else if (react && cur) {
      cur.reactions = react[2]!.trim()
    } else if (cur) {
      cur.body.push(line.slice(Math.min(cur.depth * 2, line.length - line.trimStart().length)))
    } else {
      intro.push(line)
    }
  }
  return { meta, intro: intro.join('\n').trim(), entries }
}

const bodyOf = (md: Md, e: Entry) => md(e.body.join('\n').trim())

// ---------- Small helpers ----------

const PALETTE = ['#e0573e', '#2f80ed', '#27ae60', '#9b51e0', '#f2994a', '#219ebc', '#d6336c', '#5c7cfa', '#0ca678', '#e67700']
function colorFor(s: string) {
  let h = 0
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return PALETTE[h % PALETTE.length]!
}
const initials = (name: string) =>
  name.replace(/[^a-z0-9 _.-]/gi, '').split(/[\s_.-]+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join('') || '?'

const avatar = (name: string, cls: string) =>
  `<span class="${cls}" style="background:${colorFor(name)}" aria-hidden="true">${esc(initials(name))}</span>`

function reactions(s: string) {
  if (!s) return ''
  const items = s.split(/\s*[·|]\s*/).filter(Boolean)
  return `<div class="emb-reactions">${items.map((r) => `<span>${esc(r)}</span>`).join('')}</div>`
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// ---------- Renderers ----------

function thread(p: Parsed, md: Md) {
  const { title = '', site = 'news.example', points, comments } = p.meta
  const count = comments || String(p.entries.filter((e) => e.type === 'entry').length)
  const head = `<header class="et-head">
  <div class="et-bar"><span class="et-site">${esc(site)}</span></div>
  ${title ? `<p class="et-title"><span class="et-vote" aria-hidden="true">▲</span>${inline(md, title)}</p>` : ''}
  <p class="et-sub">${points ? `${esc(points)} points · ` : ''}${esc(count)} ${count === '1' ? 'comment' : 'comments'}</p>
</header>`
  const list = p.entries
    .filter((e) => e.type === 'entry')
    .map(
      (e) => `<div class="et-c" style="--depth:${Math.min(e.depth, 6)}">
  <p class="et-c-meta"><span class="et-vote" aria-hidden="true">▲</span><span class="et-user">${esc(e.name)}</span> ${esc(e.meta)}</p>
  <div class="et-c-body">${bodyOf(md, e)}</div>${reactions(e.reactions)}
</div>`,
    )
    .join('\n')
  return `${head}<div class="et-comments">${list}</div>`
}

function issue(p: Parsed, md: Md) {
  const { title = 'Untitled issue', number = '1', repo = '', status = 'open' } = p.meta
  const labels = (p.meta.labels ?? '').split(',').map((s) => s.trim()).filter(Boolean)
  const state = status.toLowerCase()
  const stateLabel = state === 'closed' ? 'Closed' : state === 'merged' ? 'Merged' : 'Open'
  const entries = p.entries
  const opener = entries.find((e) => e.type === 'entry')
  const commentCount = Math.max(0, entries.filter((e) => e.type === 'entry').length - 1)
  const chips = labels
    .map((l) => `<span class="ei-label" style="--c:${colorFor(l)}">${esc(l)}</span>`)
    .join('')
  const timeline = entries
    .map((e) => {
      if (e.type === 'event') {
        return `<li class="ei-event"><span class="ei-dot" aria-hidden="true"></span><span>${inline(md, e.meta.replace(/(^|\s)@([\w.-]+)/g, '$1**$2**'))}</span></li>`
      }
      const verb = e === opener ? 'opened this issue' : 'commented'
      return `<li class="ei-comment">${avatar(e.name, 'ei-avatar')}
  <div class="ei-box">
    <div class="ei-box-head"><strong>${esc(e.name)}</strong> ${verb}${e.meta ? ` ${esc(e.meta)}` : ''}</div>
    <div class="ei-body">${bodyOf(md, e) || '<p class="ei-empty">No description provided.</p>'}</div>${reactions(e.reactions)}
  </div>
</li>`
    })
    .join('\n')
  return `<header class="ei-head">
  ${repo ? `<p class="ei-repo">${esc(repo)}</p>` : ''}
  <p class="ei-title">${inline(md, title)} <span class="ei-num">#${esc(number)}</span></p>
  <p class="ei-state"><span class="ei-pill ei-${esc(state)}">${stateLabel}</span>
    ${opener ? `<strong>${esc(opener.name)}</strong> opened this issue${opener.meta ? ` ${esc(opener.meta)}` : ''} · ` : ''}${plural(commentCount, 'comment')}</p>
  ${chips ? `<p class="ei-labels">${chips}</p>` : ''}
</header>
<ol class="ei-timeline">${timeline}</ol>`
}

function changelog(p: Parsed, md: Md) {
  const { product = '', url = '' } = p.meta
  // The changelog itself is plain Markdown: "## 5.0.0 — Nov 1, 2026", then "### Added", "### Fixed"…
  const src = [p.intro, ...p.entries.map((e) => `@${e.name} ${e.meta}\n${e.body.join('\n')}`)].join('\n')
  const html = md(src)
    .replace(/<h3>([\s\S]*?)<\/h3>/g, (_, t: string) => `<h3 class="ec-tag ec-${slug(t.replace(/<[^>]+>/g, ''))}">${t}</h3>`)
    .replace(/<h2>([\s\S]*?)<\/h2>/g, '<h2 class="ec-version">$1</h2>')
  return `<header class="ec-head"><span class="ec-product">${esc(product || 'Release notes')}</span>${url ? `<span class="ec-url">${esc(url)}</span>` : ''}</header>
<div class="ec-body">${html}</div>`
}

function chat(p: Parsed, md: Md) {
  const { channel = '#general', workspace = '' } = p.meta
  const msgs = p.entries
    .filter((e) => e.type === 'entry')
    .map(
      (e) => `<div class="ech-msg">${avatar(e.name, 'ech-avatar')}
  <div class="ech-content">
    <p class="ech-meta"><strong>${esc(e.name)}</strong> <span>${esc(e.meta)}</span></p>
    <div class="ech-body">${bodyOf(md, e)}</div>${reactions(e.reactions)}
  </div>
</div>`,
    )
    .join('\n')
  return `<header class="ech-head"><span class="ech-channel">${esc(channel)}</span>${workspace ? `<span class="ech-ws">${esc(workspace)}</span>` : ''}</header>
<div class="ech-msgs">${msgs}</div>`
}

function incident(p: Parsed, md: Md) {
  const { title = 'Service disruption', company = '', impact = 'minor' } = p.meta
  const components = (p.meta.components ?? '').split(',').map((s) => s.trim()).filter(Boolean)
  const level = slug(impact) || 'minor'
  const banner: Record<string, string> = {
    none: 'All systems operational',
    minor: 'Partial outage',
    major: 'Major outage',
    critical: 'Critical outage',
    maintenance: 'Scheduled maintenance',
  }
  const updates = p.entries
    .filter((e) => e.type === 'entry')
    .map(
      (e) => `<li class="ein-update">
  <p class="ein-status ein-s-${slug(e.name)}">${esc(e.name)}</p>
  <div class="ein-text">${bodyOf(md, e)}<p class="ein-time">${esc(e.meta)}</p></div>
</li>`,
    )
    .join('\n')
  return `<header class="ein-head">
  ${company ? `<p class="ein-company">${esc(company)} Status</p>` : ''}
  <p class="ein-banner ein-${level}">${esc(banner[level] ?? impact)}</p>
</header>
<div class="ein-incident">
  <p class="ein-title">${inline(md, title)}</p>
  ${components.length ? `<p class="ein-components">Affected: ${components.map(esc).join(', ')}</p>` : ''}
  <ol class="ein-updates">${updates}</ol>
</div>`
}

function memo(p: Parsed, md: Md) {
  const fields = ['to', 'from', 'cc', 'date', 'subject'] as const
  const { classification = 'Internal — do not forward' } = p.meta
  const rows = fields
    .filter((f) => p.meta[f])
    .map((f) => `<tr><th>${f[0]!.toUpperCase() + f.slice(1)}:</th><td>${inline(md, p.meta[f]!)}</td></tr>`)
    .join('')
  const rest = [p.intro, ...p.entries.map((e) => `@${e.name} ${e.meta}\n${e.body.join('\n')}`)].join('\n').trim()
  return `<p class="em-stamp">${esc(classification)}</p>
<p class="em-word">Memorandum</p>
${rows ? `<table class="em-fields">${rows}</table>` : ''}
<div class="em-body">${md(rest)}</div>`
}

/**
 * Review verdict box. Unlike the other embeds this is the publication's own furniture, so it uses the
 * site's colors and fonts. Syntax:
 *
 *   product: Orbit Ring
 *   price: $349 + $9.99/month
 *   score: 4
 *   badge: Bloat Award            (optional: Editor’s Choice, Bloat Award, Do Not Buy, or anything)
 *   verdict: A great ring, if you can keep it.
 *   specs: Weight = 4 g; Battery = 6 days
 *   + A good thing
 *   - A bad thing
 */
export function reviewScore(src: string): number | null {
  const m = /^score:\s*([\d.]+)/im.exec(src)
  if (!m) return null
  const n = Number(m[1])
  return Number.isFinite(n) ? Math.max(0, Math.min(10, Math.round(n * 10) / 10)) : null
}

function review(src: string, md: Md) {
  const meta: Record<string, string> = {}
  const good: string[] = []
  const bad: string[] = []
  for (const raw of src.replace(/\r\n/g, '\n').split('\n')) {
    const line = raw.trim()
    if (!line) continue
    if (line.startsWith('+ ')) good.push(line.slice(2))
    else if (line.startsWith('- ')) bad.push(line.slice(2))
    else {
      const m = /^([a-z_]+):\s*(.*)$/i.exec(line)
      if (m) meta[m[1]!.toLowerCase()] = m[2]!.trim()
    }
  }
  const score = reviewScore(src)
  const specs = (meta.specs ?? '')
    .split(';')
    .map((s) => s.split('='))
    .filter((p) => p.length === 2 && p[0]!.trim())
    .map(([k, v]) => `<div><dt>${esc(k!.trim())}</dt><dd>${inline(md, v!.trim())}</dd></div>`)
    .join('')
  const list = (title: string, items: string[], cls: string) =>
    items.length ? `<div class="rv-list rv-${cls}"><p class="rv-h">${title}</p><ul>${items.map((i) => `<li>${inline(md, i)}</li>`).join('')}</ul></div>` : ''
  const scoreText = score === null ? '' : Number.isInteger(score) ? String(score) : score.toFixed(1)
  return `<div class="rv-top">
  ${score === null ? '' : `<p class="rv-score" aria-label="Score: ${scoreText} out of 10"><span>${scoreText}</span><small>/10</small></p>`}
  <div class="rv-head">
    ${meta.badge ? `<p class="rv-badge rv-badge-${slug(meta.badge)}">${esc(meta.badge)}</p>` : ''}
    <p class="rv-product">${esc(meta.product ?? 'Untitled product')}</p>
    ${meta.price ? `<p class="rv-price">${inline(md, meta.price)}</p>` : ''}
    ${meta.verdict ? `<p class="rv-verdict">${inline(md, meta.verdict)}</p>` : ''}
  </div>
</div>
${good.length || bad.length ? `<div class="rv-cols">${list('The good', good, 'good')}${list('The bad', bad, 'bad')}</div>` : ''}
${specs ? `<dl class="rv-specs">${specs}</dl>` : ''}`
}

/**
 * A pull quote readers can share as an image (public/js/share.js makes the card).
 *   ```quote
 *   We didn't remove the screen. We removed the distraction.
 *   — Jony Ive, LoveFrom
 *   ```
 * The last line starting with "—", "–" or "--" is the attribution.
 */
export function parseQuote(src: string) {
  const lines = src.replace(/\r\n/g, '\n').split('\n').map((l) => l.trim()).filter(Boolean)
  let by = ''
  const at = lines.findLastIndex((l) => /^(?:—|–|--)\s*\S/.test(l))
  if (at > 0) by = lines.splice(at, 1)[0]!.replace(/^(?:—|–|--)\s*/, '')
  const text = lines.join(' ').replace(/^["“”]+|["“”]+$/g, '').trim()
  return { text, by }
}

function quote(src: string) {
  const { text, by } = parseQuote(src)
  return `<figure class="emb emb-quote" data-quote="${esc(text)}" data-by="${esc(by)}"><blockquote><p>“${esc(text)}”</p></blockquote>${by ? `<figcaption>${esc(by)}</figcaption>` : ''}</figure>`
}

const RENDERERS: Record<Exclude<EmbedKind, 'review' | 'quote'>, (p: Parsed, md: Md) => string> = { thread, issue, changelog, chat, incident, memo }

const LABELS: Record<EmbedKind, string> = {
  thread: 'Discussion thread',
  issue: 'Issue',
  changelog: 'Changelog',
  chat: 'Chat log',
  incident: 'Status page',
  memo: 'Internal memo',
  review: 'Review verdict',
  quote: 'Quote',
}

export function renderEmbed(kind: EmbedKind, src: string, md: Md): string {
  if (kind === 'quote') return quote(src)
  if (kind === 'review') return `<figure class="emb emb-review" aria-label="${LABELS.review}"><div class="rv">${review(src, md)}</div></figure>`
  const p = parse(src)
  // For thread/issue/chat/incident, text before the first entry is a caption-style intro.
  const intro = p.intro && kind !== 'changelog' && kind !== 'memo' ? `<div class="emb-intro">${md(p.intro)}</div>` : ''
  const caption = p.meta.caption ? `<figcaption class="emb-caption">${inline(md, p.meta.caption)}</figcaption>` : ''
  return `<figure class="emb emb-${kind}" aria-label="${LABELS[kind]}">${intro}<div class="emb-frame">${RENDERERS[kind](p, md)}</div>${caption}</figure>`
}
