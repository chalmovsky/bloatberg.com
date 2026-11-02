// Bloatberg CMS — editor enhancements.
// The form works without this script, except image upload and live preview.

/**
 * Article pictures are shown cropped to fill 16:9, 3:2 and square slots. A landscape photo
 * survives that; a logo or other graphic, a portrait or a tall screenshot doesn't. Those are
 * placed whole on a 1600×900 background instead, small enough that even the square crop
 * (the middle 900 px) keeps all of it. Returns the framed canvas, or null for landscape
 * photos, which are left as they are.
 */
function bbFrameImage(img) {
  const W = 1600, H = 900
  const iw = img.width, ih = img.height
  const fill = bbEdgeFill(img)
  const landscape = iw / ih >= 1.3 && iw / ih <= 2.2
  if (landscape && !fill) return null
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingQuality = 'high'

  if (fill) {
    // A logo or graphic on a plain color: extend that color, so it looks like one picture.
    ctx.fillStyle = fill
    ctx.fillRect(0, 0, W, H)
  } else {
    // A photo: a blurred, darkened copy of itself fills the frame, as news sites do.
    const cover = Math.max(W / iw, H / ih) * 1.15
    const bw = iw * cover, bh = ih * cover
    ctx.filter = 'blur(48px)'
    if (ctx.filter === 'blur(48px)') {
      ctx.drawImage(img, (W - bw) / 2, (H - bh) / 2, bw, bh)
      ctx.filter = 'none'
    } else {
      // No canvas filters (older Safari): shrink to a few pixels and stretch back up.
      const tiny = document.createElement('canvas')
      tiny.width = 24
      tiny.height = 14
      const t = tiny.getContext('2d')
      t.drawImage(img, (24 - bw * 24 / W) / 2, (14 - bh * 14 / H) / 2, bw * 24 / W, bh * 14 / H)
      ctx.drawImage(tiny, 0, 0, W, H)
    }
    ctx.fillStyle = 'rgba(0,0,0,.28)'
    ctx.fillRect(0, 0, W, H)
  }

  // At most 860 px wide (inside the square crop) and 650 px tall, and never blown up more
  // than 1.6× (it would go soft).
  const s = Math.min(860 / iw, 650 / ih, 1.6)
  const dw = Math.round(iw * s), dh = Math.round(ih * s)
  ctx.drawImage(img, Math.round((W - dw) / 2), Math.round((H - dh) / 2), dw, dh)
  return canvas
}

/** The color to extend around a picture whose edges are one plain color, or null if they aren't. */
function bbEdgeFill(img) {
  const N = 64
  const c = document.createElement('canvas')
  c.width = N
  c.height = N
  const x = c.getContext('2d', { willReadFrequently: true })
  x.drawImage(img, 0, 0, N, N)
  const px = x.getImageData(0, 0, N, N).data
  const edge = []
  for (let i = 0; i < N; i++) for (const [cx, cy] of [[i, 0], [i, N - 1], [0, i], [N - 1, i]]) edge.push((cy * N + cx) * 4)

  // Transparent edges (a logo cut out as PNG or SVG): pick light or dark to contrast with the logo.
  if (edge.filter((o) => px[o + 3] < 128).length > edge.length / 2) {
    let lum = 0, n = 0
    for (let o = 0; o < px.length; o += 4) {
      if (px[o + 3] < 128) continue
      lum += 0.2126 * px[o] + 0.7152 * px[o + 1] + 0.0722 * px[o + 2]
      n++
    }
    return n && lum / n > 160 ? '#1d1d1f' : '#f2f2f2'
  }

  const mean = [0, 1, 2].map((ch) => edge.reduce((a, o) => a + px[o + ch], 0) / edge.length)
  const spread = Math.max(...[0, 1, 2].map((ch) =>
    Math.sqrt(edge.reduce((a, o) => a + (px[o + ch] - mean[ch]) ** 2, 0) / edge.length)))
  return spread < 14 ? `rgb(${mean.map(Math.round).join(',')})` : null
}

(() => {
  // Confirmation for destructive buttons, on every admin page that loads this script.
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-confirm]')
    if (btn && !confirm(btn.dataset.confirm)) e.preventDefault()
  })

  const form = document.getElementById('editor-form')
  if (!form) return
  const $ = (id) => document.getElementById(id)

  const title = $('f-title')
  const dek = $('f-dek')
  const slug = $('f-slug')
  const body = $('f-body')
  const preview = $('preview')
  const previewState = $('preview-state')
  const wordCount = $('word-count')

  // ---------- Dirty tracking ----------
  let dirty = false
  form.addEventListener('input', () => { dirty = true })
  form.addEventListener('submit', (e) => { if (!e.defaultPrevented) dirty = false })
  window.addEventListener('beforeunload', (e) => { if (dirty) { e.preventDefault(); e.returnValue = '' } })

  // ---------- Auto-growing headline and dek (for browsers without field-sizing) ----------
  const grow = (el) => { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px' }
  if (!CSS.supports('field-sizing', 'content')) {
    for (const el of [title, dek]) { grow(el); el.addEventListener('input', () => grow(el)) }
  }
  // Headline and dek are single-line: Enter moves on instead of adding a newline.
  title.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); dek.focus() } })
  dek.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); body.focus() } })

  // ---------- Slug: follows the headline until edited by hand ----------
  const slugify = (s) => {
    let out = s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
      .replace(/['’]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    if (out.length > 80) {
      const cut = out.slice(0, 80)
      const i = cut.lastIndexOf('-')
      out = (i > 40 ? cut.slice(0, i) : cut).replace(/-+$/g, '')
    }
    return out
  }
  let slugAuto = slug.dataset.auto === '1'
  title.addEventListener('input', () => { if (slugAuto) slug.value = slugify(title.value) })
  slug.addEventListener('input', () => { slugAuto = slug.value === '' })
  slug.addEventListener('blur', () => { slug.value = slugify(slug.value) })

  // ---------- Word count ----------
  const countWords = () => {
    const n = body.value.trim() ? body.value.trim().split(/\s+/).length : 0
    wordCount.textContent = `${n.toLocaleString()} words · ${Math.max(1, Math.ceil(n / 230))} min read`
  }
  countWords()

  // ---------- Format: Story / Live updates / In Brief ----------
  const currentFormat = () => form.querySelector('input[name=format]:checked')?.value || 'story'
  form.addEventListener('change', (e) => {
    if (e.target.name !== 'format') return
    const f = currentFormat()
    form.classList.remove('format-story', 'format-live', 'format-brief')
    form.classList.add(`format-${f}`)
    preview.className = `prose ${f === 'live' ? 'live-body' : 'article-body'}`
    refresh()
  })

  // ---------- Live preview (rendered on the server, so it matches the site) ----------
  let timer, inflight
  const refresh = async () => {
    inflight?.abort()
    inflight = new AbortController()
    previewState.textContent = 'Updating…'
    try {
      const res = await fetch(`/admin/preview?format=${encodeURIComponent(currentFormat())}`, {
        method: 'POST', body: body.value, signal: inflight.signal,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
      if (!res.ok) throw new Error(res.status)
      preview.innerHTML = await res.text()
      previewState.textContent = ''
    } catch (err) {
      if (err.name !== 'AbortError') previewState.textContent = 'Preview unavailable'
    }
  }
  body.addEventListener('input', () => {
    countWords()
    clearTimeout(timer)
    timer = setTimeout(refresh, 400)
  })

  // Tab inserts spaces in the Markdown field rather than leaving it.
  body.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || e.shiftKey) return
    e.preventDefault()
    document.execCommand('insertText', false, '  ')
  })

  // ---------- Image upload: resize + WebP in the browser, then upload ----------
  const drop = $('dropzone')
  const file = $('f-file')
  const keyInput = $('f-image-key')
  const thumb = $('image-thumb')
  const state = $('image-state')
  const MAX_EDGE = 2000
  const QUALITY = 0.82
  const setState = (msg, err) => { state.textContent = msg; state.classList.toggle('err', !!err) }
  const kb = (n) => n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`

  async function toWebp(f) {
    const bitmap = await createImageBitmap(f, { imageOrientation: 'from-image' })
    let canvas = bbFrameImage(bitmap)
    const framed = !!canvas
    if (!canvas) {
      const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
      canvas = document.createElement('canvas')
      canvas.width = Math.round(bitmap.width * scale)
      canvas.height = Math.round(bitmap.height * scale)
      const ctx = canvas.getContext('2d')
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    }
    bitmap.close?.()
    const blob = await new Promise((r) => canvas.toBlob(r, 'image/webp', QUALITY))
    if (!blob || blob.type !== 'image/webp') {
      throw new Error('This browser can’t create WebP images. Please use Chrome, Edge or Firefox.')
    }
    return { blob, w: canvas.width, h: canvas.height, framed }
  }

  async function sha256hex(buf) {
    const d = await crypto.subtle.digest('SHA-256', buf)
    return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('')
  }

  /** Uploads a WebP blob to R2 and returns { key, url }. */
  async function uploadBlob(blob) {
    const buf = await blob.arrayBuffer()
    const hash = await sha256hex(buf)
    const res = await fetch('/admin/upload', {
      method: 'POST', body: buf,
      headers: { 'Content-Type': 'image/webp', 'X-Content-SHA256': hash },
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`)
    return data
  }

  async function uploadWebp(blob) {
    const data = await uploadBlob(blob)
    keyInput.value = data.key
    thumb.src = data.url
    thumb.hidden = false
    drop.classList.add('has-image')
    return data
  }

  async function handle(f) {
    if (!f) return
    if (!f.type.startsWith('image/')) return setState('That file isn’t an image.', true)
    try {
      setState(`Processing ${f.name}…`)
      const { blob, w, h, framed } = await toWebp(f)
      setState(`Uploading ${kb(blob.size)} WebP (${w}×${h})…`)
      await uploadWebp(blob)
      dirty = true
      const note = framed ? ' Placed whole on a 16:9 background, so no slot crops it.' : ''
      setState(`Uploaded: ${kb(f.size)} → ${kb(blob.size)} WebP, ${w}×${h}.${note} Save to keep it.`)
    } catch (err) {
      setState(err.message || 'Upload failed.', true)
    }
  }

  drop.addEventListener('click', (e) => { if (e.target.tagName !== 'LABEL') file.click() })
  file.addEventListener('change', () => { handle(file.files[0]); file.value = '' })
  for (const ev of ['dragenter', 'dragover']) {
    drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('dragging') })
  }
  for (const ev of ['dragleave', 'drop']) {
    drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('dragging') })
  }
  drop.addEventListener('drop', (e) => handle(e.dataTransfer.files[0]))
  // Paste an image straight into the page.
  document.addEventListener('paste', (e) => {
    const item = [...(e.clipboardData?.items || [])].find((i) => i.type.startsWith('image/'))
    if (item) { e.preventDefault(); handle(item.getAsFile()) }
  })

  // ---------- Embed templates (```thread, ```issue …), rendered by the server ----------
  const TEMPLATES = {
    quote: `\`\`\`quote
We are not removing features. We are removing friction.
— Dana Whitlock, chief executive, Halo
\`\`\``,
    review: `\`\`\`review
product: Halo Mug Pro
price: $129 + $4.99/month
score: 5
badge: Bloat Award
verdict: Keeps coffee warm. Also keeps your data.
specs: Capacity = 350 ml; Battery = 9 hours; Apps = 3
+ Coffee stays hot
+ Feels expensive, because it is
- Needs Wi-Fi to pour
- Firmware update mid-sip
\`\`\``,
    thread: `\`\`\`thread
title: Ask: Is it normal for my startup to have more AI agents than customers?
points: 412
comments: 318

@throwaway_founder · 5 hours ago
We have 40 agents and 3 customers. Two of the customers are agents.

  @greybeard_1987 · 4 hours ago
  In my day we had more microservices than customers and we liked it.

    @throwaway_founder · 4 hours ago
    Did you also raise a Series B?
+ ▲ 88

@pedantic_pat · 3 hours ago
Technically, an agent paying for a subscription *is* revenue.
\`\`\``,
    issue: `\`\`\`issue
repo: tinyjs/is-even
title: Is this project dead?
number: 2231
status: closed
labels: question, wontfix

@concerned_dev · opened on Mar 3, 2019
No commits in 4 years. Is this still maintained?
+ 👍 214 · 👀 31

@enterprise_user · 2 weeks ago
We are a Fortune 500 company and this is blocking our release. Any ETA?

! @maintainer added the wontfix label
@maintainer · yesterday
yes
! @maintainer closed this as completed
\`\`\``,
    changelog: `\`\`\`changelog
product: Halo Assistant
url: halo.example/changelog

## 5.0.0 — November 1, 2026

### Added
- The assistant now apologizes before, during and after every response.

### Fixed
- Fixed an issue where the assistant would answer the question that was asked.

### Removed
- The ability to say “I don’t know.”
\`\`\``,
    chat: `\`\`\`chat
channel: #general
workspace: Stackwise

@Priya · 9:02 AM
Quick reminder that the all-hands is mandatory and also optional 🙂

@Devin · 9:03 AM
which one
+ 😂 14 · 👀 6

@Priya · 9:03 AM
Yes
\`\`\``,
    incident: `\`\`\`incident
company: Nimbus Cloud
title: Degraded vibes in us-east-1
impact: major
components: Morale, Slack, The Kitchen

@Resolved · Nov 1, 11:40 ET
Vibes have returned to baseline. A postmortem will follow, after which vibes are expected to degrade again.

@Monitoring · Nov 1, 10:15 ET
Pizza has been deployed to all affected regions.

@Investigating · Nov 1, 09:31 ET
We are investigating reports of degraded vibes following this morning’s all-hands.
\`\`\``,
    memo: `\`\`\`memo
to: All staff
from: Office of the CEO
date: November 1, 2026
subject: Our Year of Efficiency, Part 4

Team,

Effective immediately, meetings about efficiency will be limited to four hours.

Thank you for your continued flexibility.
\`\`\``,
  }
  const bar = $('insert-bar')
  if (bar) {
    bar.hidden = false
    bar.addEventListener('click', (e) => {
      const kind = e.target.closest('[data-insert]')?.dataset.insert
      if (!kind) return
      if (kind === 'update') return insertLiveUpdate()
      body.focus()
      const before = body.value.slice(0, body.selectionStart)
      const pad = before && !before.endsWith('\n\n') ? (before.endsWith('\n') ? '\n' : '\n\n') : ''
      document.execCommand('insertText', false, pad + TEMPLATES[kind] + '\n\n')
      body.dispatchEvent(new Event('input', { bubbles: true }))
    })
  }

  // ---------- "+ Live update": a new timestamped entry at the top ----------
  const nowET = () =>
    new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit' }).format(new Date()) + ' ET'
  function insertLiveUpdate() {
    const text = body.value
    const first = text.search(/^@/m)
    const at = first === -1 ? text.length : first
    const block = `@${nowET()}\n## \n\n\n\n`
    body.focus()
    body.setSelectionRange(at, at)
    const pad = at > 0 && !text.slice(0, at).endsWith('\n\n') ? (text.slice(0, at).endsWith('\n') ? '\n' : '\n\n') : ''
    document.execCommand('insertText', false, pad + block)
    const cursor = at + pad.length + block.indexOf('## ') + 3
    body.setSelectionRange(cursor, cursor)
    body.dispatchEvent(new Event('input', { bubbles: true }))
  }

  // ---------- Share card: the 1200×630 picture people see when they share the link ----------
  // Stories and live coverage: the picture on top, then the nameplate, kicker and headline.
  // Briefs: no picture, a big headline. X no longer shows headlines under link previews, so the
  // headline has to be in the picture. Remade whenever what it shows changes (see sig()).
  const shareKey = $('f-share-key')
  const shareFor = $('f-share-for')
  const shareThumb = $('share-thumb')
  const shareState = $('share-state')
  const sectionSel = form.querySelector('select[name=section]')
  const labelSel = form.querySelector('select[name=label]')
  const CARD_W = 1200, CARD_H = 630, CX = 56, RED = '#c8102e', INK = '#121212'

  const scoreOf = () => {
    const m = /^\s*```review\s*\n[\s\S]*?^score:\s*([\d.]+)/m.exec(body.value)
    return m ? String(Math.round(Math.min(10, Number(m[1])) * 10) / 10) : ''
  }
  const sig = () => [currentFormat(), title.value.trim(), keyInput.value, sectionSel?.value, labelSel?.value, scoreOf()].join('|')
  const needsCard = () => {
    const brief = currentFormat() === 'brief'
    return title.value.trim() && (brief || keyInput.value) && (!shareKey.value || shareFor.value !== sig())
  }
  const spaced = (ctx, px) => { if ('letterSpacing' in ctx) ctx.letterSpacing = `${px}px` }

  /** Wraps words into at most `max` lines, shrinking the font until it fits. Truncates as a last resort. */
  function fit(ctx, text, width, max, sizes, weight = '600') {
    const words = text.split(/\s+/)
    let lines = [], size = sizes[0]
    for (size of sizes) {
      ctx.font = `${weight} ${size}px Newsreader`
      lines = []
      let line = ''
      for (const w of words) {
        const test = line ? `${line} ${w}` : w
        if (ctx.measureText(test).width > width && line) { lines.push(line); line = w } else line = test
      }
      lines.push(line)
      if (lines.length <= max) return { size, lines }
    }
    lines = lines.slice(0, max)
    let last = lines[max - 1]
    while (last && ctx.measureText(`${last}…`).width > width) last = last.replace(/\s*\S+$/, '')
    lines[max - 1] = `${last}…`
    return { size, lines }
  }

  function kickerText() {
    const section = (sectionSel?.selectedOptions[0]?.textContent || '').toUpperCase()
    const label = (labelSel?.value || '').toUpperCase()
    const fmt = currentFormat()
    const score = scoreOf()
    return [fmt === 'live' ? 'LIVE' : fmt === 'brief' ? 'IN BRIEF' : '', `${label}S` === section ? '' : label, section, score ? `${score}/10` : '']
      .filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join('  ·  ')
  }

  async function drawCard() {
    await Promise.all(['600 64px Newsreader', '700 34px Nameplate', '700 22px Franklin', '500 22px Franklin'].map((f) => document.fonts.load(f)))
    const canvas = document.createElement('canvas')
    canvas.width = CARD_W
    canvas.height = CARD_H
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, CARD_W, CARD_H)
    const siteName = (document.querySelector('.admin-brand .nameplate')?.textContent || '').toUpperCase()
    const headline = title.value.trim()

    if (currentFormat() === 'brief') {
      ctx.fillStyle = RED
      ctx.fillRect(0, 0, CARD_W, 10)
      ctx.fillStyle = INK
      ctx.font = '700 34px Nameplate'
      spaced(ctx, 2); ctx.fillText(siteName, 72, 92); spaced(ctx, 0)
      ctx.fillStyle = RED
      ctx.font = '700 22px Franklin'
      spaced(ctx, 3); ctx.fillText(kickerText(), 72, 168); spaced(ctx, 0)
      const { size, lines } = fit(ctx, headline, CARD_W - 144, 4, [78, 72, 66, 60, 54, 48, 44, 40])
      ctx.fillStyle = INK
      const lh = Math.round(size * 1.1)
      lines.forEach((l, i) => ctx.fillText(l, 72, 208 + lh * (i + 1) - Math.round(size * 0.22)))
      ctx.fillStyle = '#e5e5e5'
      ctx.fillRect(72, CARD_H - 78, CARD_W - 144, 1)
      ctx.fillStyle = '#5c5c5c'
      ctx.font = '500 22px Franklin'
      ctx.fillText(new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date()), 72, CARD_H - 36)
    } else {
      // Picture, cropped to fill the top.
      const PH = 382
      const img = new Image()
      img.src = thumb.src
      await img.decode()
      const scale = Math.max(CARD_W / img.naturalWidth, PH / img.naturalHeight)
      const sw = CARD_W / scale, sh = PH / scale
      ctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, 0, 0, CARD_W, PH)
      ctx.fillStyle = RED
      ctx.fillRect(0, PH, CARD_W, 6)
      // Nameplate, then the kicker in red.
      ctx.fillStyle = INK
      ctx.font = '700 26px Nameplate'
      spaced(ctx, 2)
      ctx.fillText(siteName, CX, PH + 52)
      const npw = ctx.measureText(siteName).width
      ctx.font = '700 17px Franklin'
      spaced(ctx, 2)
      ctx.fillStyle = RED
      const k = kickerText()
      if (k) ctx.fillText(`·  ${k}`, CX + npw + 16, PH + 51)
      spaced(ctx, 0)
      const { size, lines } = fit(ctx, headline, CARD_W - CX * 2, 3, [46, 43, 40, 37, 34, 31, 29])
      ctx.fillStyle = INK
      ctx.font = `600 ${size}px Newsreader`
      const lh = Math.round(size * 1.12)
      lines.forEach((l, i) => ctx.fillText(l, CX, PH + 70 + size + lh * i))
    }
    const blob = await new Promise((r) => canvas.toBlob(r, 'image/webp', 0.88))
    if (!blob || blob.type !== 'image/webp') throw new Error('This browser can’t create WebP images.')
    const data = await uploadBlob(blob)
    shareKey.value = data.key
    shareFor.value = sig()
    shareThumb.src = data.url
    shareThumb.hidden = false
  }

  // Runs before the generic submit handlers (capture), and holds the submit until the card is uploaded.
  let carding = false
  form.addEventListener('submit', async (e) => {
    if (carding || !needsCard()) return
    e.preventDefault()
    const submitter = e.submitter
    carding = true
    shareState.textContent = 'Making the share card…'
    try {
      await drawCard()
      shareState.textContent = 'Share card updated.'
    } catch (err) {
      shareState.textContent = `Couldn’t make a share card (${err.message}). The article picture will be used.`
    }
    form.requestSubmit(submitter)
    carding = false
  }, true)

  // ---------- Shortcuts ----------
  form.addEventListener('submit', (e) => {
    if (e.defaultPrevented) return
    for (const b of form.querySelectorAll('button')) setTimeout(() => { b.disabled = true }, 0)
  })
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault()
      form.querySelector('button[type=submit]').click()
    }
  })

  // ---------- Byline: suggest the section's desk writer until someone picks one by hand ----------
  const byline = document.getElementById('f-byline')
  const sectionPick = document.querySelector('select[name=section]')
  if (byline && sectionPick) {
    let desks = {}
    try { desks = JSON.parse(byline.dataset.desks || '{}') } catch {}
    byline.addEventListener('change', () => { byline.dataset.auto = '0' })
    sectionPick.addEventListener('change', () => {
      const id = desks[sectionPick.value]
      if (byline.dataset.auto === '1' && id) byline.value = String(id)
    })
  }
})()
