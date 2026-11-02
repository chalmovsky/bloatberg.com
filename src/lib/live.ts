// Live updates. The body of a "live" article is a list of timestamped updates,
// newest first, each with its own headline:
//
//   Optional intro paragraph(s) — what's going on.
//
//   @6:10 PM ET
//   ## The email now requires alignment
//   Body text in Markdown.
//
//   @4:55 PM ET
//   ## Attendees agree this should have been an email
//
// Rendered on save; the newest headline and the update count are stored with the article.

type Md = (src: string) => string

interface Update {
  time: string
  headline: string
  body: string
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function parseLive(src: string): { intro: string; updates: Update[] } {
  const lines = src.replace(/\r\n/g, '\n').split('\n')
  const intro: string[] = []
  const updates: Update[] = []
  let cur: { time: string; headline: string; body: string[] } | undefined
  const flush = () => {
    if (cur) updates.push({ time: cur.time, headline: cur.headline, body: cur.body.join('\n').trim() })
  }
  let inFence = false
  for (const line of lines) {
    if (/^\s*```/.test(line)) inFence = !inFence
    // "@name" lines inside an embedded thread/chat belong to the embed, not to the live feed.
    const head = inFence ? null : /^@\s*(.+?)\s*$/.exec(line)
    if (head) {
      flush()
      cur = { time: head[1]!, headline: '', body: [] }
      continue
    }
    if (!cur) {
      intro.push(line)
      continue
    }
    const hed = /^#{1,3}\s+(.+?)\s*#*\s*$/.exec(line)
    if (hed && !cur.headline && cur.body.every((l) => !l.trim())) {
      cur.headline = hed[1]!
      cur.body = []
    } else {
      cur.body.push(line)
    }
  }
  flush()
  return { intro: intro.join('\n').trim(), updates }
}

/** Strips inline Markdown for plain-text uses (front page, meta tags). */
export const plainText = (s: string) =>
  s.replace(/[*_`~]/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').trim()

export function renderLive(src: string, md: Md): { html: string; latest: string; count: number } {
  const { intro, updates } = parseLive(src)
  const n = updates.length
  const inline = (s: string) => md(s).trim().replace(/^<p>([\s\S]*)<\/p>$/, '$1')
  // Anchors count up from the oldest update, so they stay stable as new ones are added on top.
  const id = (i: number) => `update-${n - i}`

  const key = updates.filter((u) => u.headline).length > 1
    ? `<nav class="live-key" aria-labelledby="live-key-h">
  <h2 class="label" id="live-key-h">Key updates</h2>
  <ol>${updates
    .map((u, i) => (u.headline ? `<li><a href="#${id(i)}">${inline(u.headline)}</a><time>${esc(u.time)}</time></li>` : ''))
    .join('')}</ol>
</nav>`
    : ''

  const feed = `<ol class="live-feed">${updates
    .map(
      (u, i) => `<li class="live-update" id="${id(i)}">
  <p class="live-time"><a href="#${id(i)}">${esc(u.time)}</a></p>
  <div class="live-content">${u.headline ? `<h2 class="live-hed">${inline(u.headline)}</h2>` : ''}${u.body ? md(u.body) : ''}</div>
</li>`,
    )
    .join('\n')}</ol>`

  return {
    html: `${intro ? `<div class="live-intro">${md(intro)}</div>` : ''}${key}${feed}`,
    latest: plainText(updates[0]?.headline ?? ''),
    count: n,
  }
}
