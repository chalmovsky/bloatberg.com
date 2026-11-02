// Share tools on article pages. The page works without this; it adds:
// - "Copy link" that actually copies, and says so
// - the system share sheet on phones
// - closing the menu on outside click / Escape
// - "Screenshot": a clean picture of the headline, made in the browser, to copy, save or share
// - "Share quote" on pull quotes (```quote blocks): the quote as a picture
(() => {
  const bar = document.querySelector('.sharebar')
  if (!bar) return
  const d = bar.dataset
  const url = d.shareUrl
  const title = d.shareTitle
  const toast = bar.querySelector('.share-toast')
  const coarse = matchMedia('(pointer: coarse)').matches
  let timer

  const say = (msg) => {
    toast.textContent = msg
    toast.classList.add('on')
    clearTimeout(timer)
    timer = setTimeout(() => toast.classList.remove('on'), 2200)
  }

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Older browsers or insecure contexts: copy from a hidden textarea.
      const ta = document.createElement('textarea')
      ta.value = text
      ta.setAttribute('readonly', '')
      ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0'
      document.body.appendChild(ta)
      ta.select()
      let ok = false
      try { ok = document.execCommand('copy') } catch {}
      ta.remove()
      return ok
    }
  }

  for (const btn of bar.querySelectorAll('[data-copy]')) {
    btn.hidden = false
    btn.addEventListener('click', async (e) => {
      e.preventDefault()
      const ok = await copy(btn.dataset.copy)
      if (!ok) return say('Couldn’t copy. Copy the address from the address bar instead.')
      say('Link copied')
      const label = btn.querySelector('[data-copy-label]')
      btn.classList.add('copied')
      if (label) label.textContent = 'Copied'
      setTimeout(() => {
        btn.classList.remove('copied')
        if (label) label.textContent = 'Copy link'
      }, 2000)
    })
  }

  // Phones and tablets: open the system share sheet instead of our menu.
  const menu = bar.querySelector('.share-menu')
  const nativeBtn = bar.querySelector('[data-native-share]')
  if (nativeBtn && navigator.share && coarse) {
    nativeBtn.addEventListener('click', async (e) => {
      e.preventDefault()
      try {
        await navigator.share({ title, url })
      } catch (err) {
        if (err && err.name !== 'AbortError') menu.open = true
      }
    })
  }

  document.addEventListener('click', (e) => { if (menu.open && !menu.contains(e.target)) menu.open = false })
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.open) menu.open = false })

  // ---------- Image cards ----------

  const canvasOk = !!document.createElement('canvas').getContext && 'toBlob' in HTMLCanvasElement.prototype
  if (!canvasOk || !window.HTMLDialogElement) return

  const W = 1200
  const RED = '#c8102e'
  const host = (() => {
    try { return new URL(document.querySelector('link[rel=canonical]').href).host.replace(/^www\./, '') } catch { return location.host }
  })()
  const slug = location.pathname.split('/').filter(Boolean).pop() || 'story'

  const fontsReady = () =>
    Promise.all(
      ['600 64px Newsreader', '400 30px Newsreader', '500 56px Newsreader', '700 20px Franklin', '500 22px Franklin', '700 40px Nameplate'].map(
        (f) => document.fonts.load(f),
      ),
    ).catch(() => {})

  const loadImg = (src) =>
    new Promise((resolve) => {
      if (!src) return resolve(null)
      const img = new Image()
      img.decoding = 'async'
      img.onload = () => resolve(img)
      img.onerror = () => resolve(null)
      img.src = src
    })

  /** Splits text into lines that fit `max` px with the current font. */
  function lines(ctx, text, max) {
    const out = []
    let line = ''
    for (const word of text.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word
      if (ctx.measureText(next).width <= max || !line) line = next
      else { out.push(line); line = word }
    }
    if (line) out.push(line)
    return out
  }

  /** Cuts to `n` lines, ending the last with an ellipsis. */
  function clamp(ctx, ls, n, max) {
    if (ls.length <= n) return ls
    const kept = ls.slice(0, n)
    let last = kept[n - 1]
    while (last && ctx.measureText(`${last}…`).width > max) last = last.replace(/\s*\S+$/, '')
    kept[n - 1] = `${last}…`
    return kept
  }

  /** Letter-spaced text (canvas letterSpacing isn't everywhere yet). */
  function spaced(ctx, text, x, y, gap, align = 'left') {
    const chars = [...text]
    const width = chars.reduce((w, ch) => w + ctx.measureText(ch).width, 0) + gap * (chars.length - 1)
    let cx = align === 'center' ? x - width / 2 : align === 'right' ? x - width : x
    const prev = ctx.textAlign
    ctx.textAlign = 'left'
    for (const ch of chars) { ctx.fillText(ch, cx, y); cx += ctx.measureText(ch).width + gap }
    ctx.textAlign = prev
    return width
  }

  /** Picks the biggest font size whose wrapped text fits in `maxLines`. */
  function fit(ctx, text, font, sizes, max, maxLines) {
    for (const s of sizes) {
      ctx.font = font(s)
      const ls = lines(ctx, text, max)
      if (ls.length <= maxLines) return { size: s, ls }
    }
    const s = sizes[sizes.length - 1]
    ctx.font = font(s)
    return { size: s, ls: clamp(ctx, lines(ctx, text, max), maxLines, max) }
  }

  function cover(ctx, img, x, y, w, h) {
    const r = Math.max(w / img.naturalWidth, h / img.naturalHeight)
    const sw = w / r, sh = h / r
    ctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, x, y, w, h)
  }

  const toBlob = (canvas) => new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))

  /** The headline as it looks on the site: nameplate, kicker, headline, dek, byline, picture. */
  async function headlineCard() {
    await fontsReady()
    const img = await loadImg(d.image)
    const P = 72, max = W - P * 2
    const c = document.createElement('canvas')
    const ctx = c.getContext('2d')

    const head = fit(ctx, d.title, (s) => `600 ${s}px Newsreader`, [68, 62, 56, 50, 46], max, 4)
    ctx.font = '400 31px Newsreader'
    const dek = d.dek ? clamp(ctx, lines(ctx, d.dek, max), 3, max) : []
    const picH = img ? Math.round(max * 9 / 16) : 0

    let h = 104 + 58 + 22 // header, gap, kicker
    h += 26 + head.ls.length * head.size * 1.1
    if (dek.length) h += 20 + dek.length * 31 * 1.38
    h += 34 + 24 // byline
    if (img) h += 36 + picH
    h += 40 + 22 + 48 // footer
    c.width = W
    c.height = Math.ceil(h)

    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, W, c.height)
    ctx.textBaseline = 'alphabetic'

    ctx.fillStyle = '#121212'
    ctx.font = '700 40px Nameplate'
    spaced(ctx, 'BLOATBERG', W / 2, 66, 3, 'center')
    ctx.fillStyle = '#e2e2e2'
    ctx.fillRect(0, 104, W, 1)

    let y = 104 + 58 + 20
    ctx.fillStyle = RED
    ctx.font = '700 19px Franklin'
    spaced(ctx, d.kicker.toUpperCase(), P, y, 2)

    y += 26
    ctx.fillStyle = '#121212'
    ctx.font = `600 ${head.size}px Newsreader`
    for (const l of head.ls) { y += head.size * 1.1; ctx.fillText(l, P, y - head.size * 0.22) }

    if (dek.length) {
      y += 20
      ctx.fillStyle = '#4a4a4a'
      ctx.font = '400 31px Newsreader'
      for (const l of dek) { y += 31 * 1.38; ctx.fillText(l, P, y - 10) }
    }

    y += 34 + 20
    ctx.font = '700 22px Franklin'
    ctx.fillStyle = '#121212'
    ctx.fillText(d.byline, P, y)
    const bw = ctx.measureText(d.byline).width
    ctx.font = '400 22px Franklin'
    ctx.fillStyle = '#6b6b6b'
    ctx.fillText(`  ·  ${d.date}`, P + bw, y)
    y += 4

    if (img) {
      y += 36
      ctx.fillStyle = '#ebe9e4'
      ctx.fillRect(P, y, max, picH)
      cover(ctx, img, P, y, max, picH)
      y += picH
    }

    y += 40
    ctx.fillStyle = '#e2e2e2'
    ctx.fillRect(P, y, max, 1)
    ctx.fillStyle = '#757575'
    ctx.font = '500 20px Franklin'
    ctx.fillText(host, P, y + 38)
    return toBlob(c)
  }

  /** A pull quote on its own: big quote mark, the words, who said it, the nameplate. */
  async function quoteCard(text, by) {
    await fontsReady()
    const P = 88, max = W - P * 2
    const c = document.createElement('canvas')
    const ctx = c.getContext('2d')
    const q = fit(ctx, `${text}”`, (s) => `500 ${s}px Newsreader`, [62, 56, 50, 46, 42, 38, 34], max, 7)
    ctx.font = '600 26px Franklin'
    const who = by ? clamp(ctx, lines(ctx, `— ${by}`, max), 2, max) : []

    let h = 10 + P + 50 // bar, padding, quote mark
    h += q.ls.length * q.size * 1.2
    if (who.length) h += 30 + who.length * 36
    h += 64 + 1 + 70 // footer
    c.width = W
    c.height = Math.max(675, Math.ceil(h))

    ctx.fillStyle = '#faf7f2'
    ctx.fillRect(0, 0, W, c.height)
    ctx.fillStyle = RED
    ctx.fillRect(0, 0, W, 10)

    ctx.font = '700 200px Newsreader'
    ctx.fillText('“', P - 10, 10 + P + 104)

    let y = 10 + P + 50
    ctx.fillStyle = '#121212'
    ctx.font = `500 ${q.size}px Newsreader`
    for (const l of q.ls) { y += q.size * 1.2; ctx.fillText(l, P, y - q.size * 0.25) }

    if (who.length) {
      y += 30
      ctx.fillStyle = '#3a3a3a'
      ctx.font = '600 26px Franklin'
      for (const l of who) { y += 36; ctx.fillText(l, P, y - 8) }
    }

    const fy = c.height - 70
    ctx.fillStyle = '#d9d4ca'
    ctx.fillRect(P, fy - 28, max, 1)
    ctx.fillStyle = '#121212'
    ctx.font = '700 28px Nameplate'
    spaced(ctx, 'BLOATBERG', P, fy + 22, 2.5)
    ctx.fillStyle = '#757575'
    ctx.font = '500 19px Franklin'
    ctx.textAlign = 'right'
    ctx.fillText(`Satire · ${host}`, W - P, fy + 20)
    ctx.textAlign = 'left'
    return toBlob(c)
  }

  // ---------- The dialog: preview, then copy / save / share ----------

  const dlg = document.createElement('dialog')
  dlg.className = 'shot'
  dlg.setAttribute('aria-labelledby', 'shot-h')
  dlg.innerHTML = `
    <div class="shot-head">
      <p class="shot-h" id="shot-h"></p>
      <button type="button" class="shot-x" aria-label="Close">×</button>
    </div>
    <div class="shot-preview"><p class="shot-wait">Making the image…</p><img alt="" hidden></div>
    <div class="shot-actions">
      <button type="button" class="btn" data-act="share" hidden>Share image</button>
      <button type="button" class="btn" data-act="copy" hidden>Copy image</button>
      <a class="btn btn-outline" data-act="save" download>Save image</a>
      <button type="button" class="btn btn-outline" data-act="link">Copy link</button>
    </div>
    <p class="shot-tip">Posting on X? Post the image, then put the link in a reply.</p>
    <p class="shot-msg" role="status" aria-live="polite"></p>`
  document.body.appendChild(dlg)

  const $ = (sel) => dlg.querySelector(sel)
  const preview = $('.shot-preview img')
  const wait = $('.shot-wait')
  const msg = $('.shot-msg')
  const btnShare = $('[data-act=share]')
  const btnCopy = $('[data-act=copy]')
  const btnSave = $('[data-act=save]')
  let current = null // { blob, file, objectUrl }

  const note = (t) => {
    msg.textContent = t
    clearTimeout(note.t)
    note.t = setTimeout(() => (msg.textContent = ''), 2600)
  }

  async function open(heading, make, filename, alt) {
    $('.shot-h').textContent = heading
    preview.hidden = true
    wait.hidden = false
    wait.textContent = 'Making the image…'
    msg.textContent = ''
    btnShare.hidden = btnCopy.hidden = true
    btnSave.removeAttribute('href')
    if (current) URL.revokeObjectURL(current.objectUrl)
    current = null
    dlg.showModal()
    let blob = null
    try { blob = await make() } catch {}
    if (!blob) { wait.textContent = 'Sorry, that didn’t work in this browser.'; return }
    const file = new File([blob], filename, { type: 'image/png' })
    const objectUrl = URL.createObjectURL(blob)
    current = { blob, file, objectUrl }
    preview.src = objectUrl
    preview.alt = alt
    preview.hidden = false
    wait.hidden = true
    btnSave.href = objectUrl
    btnSave.download = filename
    btnShare.hidden = !(coarse && navigator.canShare && navigator.canShare({ files: [file] }))
    btnCopy.hidden = !(navigator.clipboard && window.ClipboardItem)
    // On phones the share sheet is the main action; on computers, copy.
    btnShare.classList.toggle('btn-outline', false)
    btnCopy.classList.toggle('btn-outline', !btnShare.hidden)
  }

  btnShare.addEventListener('click', async () => {
    if (!current) return
    try {
      await navigator.share({ files: [current.file], text: `${title} ${url}` })
    } catch (err) {
      if (err && err.name !== 'AbortError') note('Couldn’t open sharing. Save the image instead.')
    }
  })
  btnCopy.addEventListener('click', async () => {
    if (!current) return
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': current.blob })])
      note('Image copied. Paste it into a post.')
    } catch {
      note('This browser won’t copy images. Save it instead.')
    }
  })
  $('[data-act=link]').addEventListener('click', async () => {
    note((await copy(url)) ? 'Link copied' : 'Couldn’t copy the link.')
  })
  $('.shot-x').addEventListener('click', () => dlg.close())
  // Click on the backdrop closes it.
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close() })

  // The headline card is made once and reused by the preview, the thumbnail and the dialog.
  let headlinePromise = null
  const headline = () => (headlinePromise ??= headlineCard().catch(() => null))
  let thumbUrl = null
  const thumb = () => headline().then((blob) => (blob && !thumbUrl ? (thumbUrl = URL.createObjectURL(blob)) : thumbUrl))

  for (const btn of document.querySelectorAll('[data-screenshot]')) {
    btn.hidden = false
    btn.addEventListener('click', () => {
      menu.open = false
      open('Screenshot', headline, `bloatberg-${slug}.png`, d.title)
    })
  }

  // The Screenshot button carries a tiny copy of the screenshot, so it's clear what it makes.
  const mini = bar.querySelector('.share-shot-mini')
  if (mini) {
    const later = window.requestIdleCallback || ((f) => setTimeout(f, 300))
    later(async () => {
      const src = await thumb()
      if (!src) return
      mini.src = src
      mini.hidden = false
      mini.closest('.share-shot').classList.add('has-mini')
    })
  }

  // End of the article: a thumbnail of the screenshot, made when the reader gets near it.
  const promo = document.querySelector('.shot-promo')
  if (promo) {
    promo.hidden = false
    const fill = async () => {
      const src = await thumb()
      const img = promo.querySelector('img')
      if (!src) return promo.remove()
      img.src = src
      img.alt = 'Preview of the screenshot'
      img.hidden = false
      promo.classList.add('ready')
    }
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((es) => {
        if (es.some((e) => e.isIntersecting)) { io.disconnect(); fill() }
      }, { rootMargin: '900px 0px' })
      io.observe(promo)
    } else fill()
  }

  const SHARE_SVG = '<svg class="icon" viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 8l5-5 5 5M5 13v7h14v-7"/></svg>'
  document.querySelectorAll('.article-body .emb-quote, .live-body .emb-quote').forEach((fig, i) => {
    const text = fig.dataset.quote
    if (!text) return
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'pq-share'
    btn.innerHTML = `${SHARE_SVG}<span>Share quote</span>`
    btn.addEventListener('click', () =>
      open('Share quote', () => quoteCard(text, fig.dataset.by || ''), `bloatberg-quote-${slug}-${i + 1}.png`, `“${text}” ${fig.dataset.by || ''}`),
    )
    fig.appendChild(btn)
  })
})()
