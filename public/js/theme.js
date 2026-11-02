// Appearance: System / Light / Dark / Random / Enterprise / AI.
// Colours are applied before paint by the inline script in <head> (window.bbTheme).
// This file wires up the buttons and adds the extras each joke mode puts on the page.
(() => {
  const root = document.documentElement
  const KEY = 'bb-theme'
  const MODES = ['system', 'light', 'dark', 'random', 'enterprise', 'ai']
  const get = () => {
    try { return localStorage.getItem(KEY) || 'system' } catch { return 'system' }
  }
  const save = (m) => {
    try { m === 'system' ? localStorage.removeItem(KEY) : localStorage.setItem(KEY, m) } catch {}
  }

  // ---------- Extras, removed again when the mode changes ----------

  const extras = []
  const add = (el) => (extras.push({ el }), el)
  const swapText = (el, text) => {
    if (!el) return
    extras.push({ el, text: el.textContent })
    el.textContent = text
  }
  function clearExtras() {
    for (const x of extras.splice(0)) {
      if ('text' in x) x.el.textContent = x.text
      else if (x.undo) x.undo()
      else x.el.remove()
    }
  }
  const h = (tag, cls, html) => {
    const el = document.createElement(tag)
    if (cls) el.className = cls
    if (html !== undefined) el.innerHTML = html
    return el
  }
  const hash = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)

  /** "Theme seed 0x3F2A · Reroll" in the corner. */
  function randomExtras() {
    const tag = add(h('div', 'seed-tag'))
    const label = h('span')
    const btn = h('button', '', 'Reroll')
    btn.type = 'button'
    const show = () => (label.textContent = `Theme seed 0x${Number(root.dataset.seed || 0).toString(16).toUpperCase().padStart(4, '0')}`)
    btn.addEventListener('click', () => { window.bbTheme('random'); show(); setThemeColor() })
    tag.append(label, btn)
    show()
    document.body.appendChild(tag)
  }

  function enterpriseExtras() {
    swapText(document.querySelector('.btn-subscribe'), matchMedia('(max-width: 374px)').matches ? 'Sales' : 'Contact sales')
    const p = document.querySelectorAll('.article-body > p')[2]
    if (!p) return
    p.classList.add('ent-locked')
    extras.push({ undo: () => p.classList.remove('ent-locked') })
    const gate = add(h('div', 'ent-gate', `
      <p class="ent-gate-h">This paragraph is available on Bloatberg Enterprise.</p>
      <p class="ent-gate-copy">Unlock paragraph 3 for your whole team. Annual billing only.</p>
      <button type="button" class="btn">Contact sales</button>`))
    const btn = gate.querySelector('button')
    btn.addEventListener('click', () => {
      btn.disabled = true
      btn.textContent = 'Thanks. Sales will be in touch within 6–8 weeks.'
    })
    p.after(gate)
  }

  function aiExtras() {
    const title = document.querySelector('.article-title')
    if (!title) return
    const head = title.closest('.article-head')
    const original = title.textContent
    const pct = 52 + (hash(original) % 46)

    const sum = add(h('aside', 'ai-summary', `
      <p class="ai-summary-k">✨ AI summary</p>
      <p class="ai-summary-t"></p>
      <p class="ai-summary-meta">Confidence: ${pct}% · Was this helpful?
        <button type="button">Yes</button><button type="button">No</button></p>`))
    sum.querySelector('.ai-summary-t').textContent = /[.!?”"]$/.test(original) ? original : `${original}.`
    for (const b of sum.querySelectorAll('button')) {
      b.addEventListener('click', () => {
        sum.querySelector('.ai-summary-meta').textContent = 'Thanks. Your feedback will be used to improve this summary.'
      })
    }
    head.appendChild(sum)

    // "Regenerate" retypes the same headline.
    const regen = add(h('button', 'ai-regen', '↻ Regenerate'))
    regen.type = 'button'
    let n = 0
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    regen.addEventListener('click', async () => {
      regen.disabled = true
      regen.textContent = 'Regenerating…'
      if (!still) {
        title.textContent = ''
        for (let i = 1; i <= original.length; i++) {
          title.textContent = original.slice(0, i)
          await new Promise((r) => setTimeout(r, 18))
        }
      }
      title.textContent = original
      n += 1
      regen.disabled = false
      regen.textContent = `↻ Regenerate (${n + 1}/∞)`
    })
    extras.push({ undo: () => (title.textContent = original) })
    title.after(regen)

    const q = document.querySelector('input[type=search], input[name=q]')
    if (q) {
      const ph = q.placeholder
      q.placeholder = 'Ask Bloatberg AI anything'
      extras.push({ undo: () => (q.placeholder = ph) })
    }
  }

  // ---------- Switching ----------

  function setThemeColor() {
    const bg = getComputedStyle(document.body).backgroundColor
    for (const m of document.querySelectorAll('meta[name=theme-color]')) {
      if (!m.dataset.orig) m.dataset.orig = m.content
      m.content = get() === 'system' ? m.dataset.orig : bg
    }
  }

  function apply(mode, { fresh = false } = {}) {
    if (fresh) window.bbTheme(mode)
    clearExtras()
    if (mode === 'random') randomExtras()
    if (mode === 'enterprise') enterpriseExtras()
    if (mode === 'ai') aiExtras()
    for (const b of document.querySelectorAll('[data-theme-set]')) b.setAttribute('aria-pressed', String(b.dataset.themeSet === mode))
    setThemeColor()
  }

  for (const el of document.querySelectorAll('.theme-menu, .menu-theme')) el.hidden = false
  for (const b of document.querySelectorAll('[data-theme-set]')) {
    b.addEventListener('click', () => {
      const mode = MODES.includes(b.dataset.themeSet) ? b.dataset.themeSet : 'system'
      save(mode)
      apply(mode, { fresh: true })
    })
  }

  // Close the appearance menu on outside click / Escape.
  const menu = document.querySelector('.theme-menu')
  if (menu) {
    document.addEventListener('click', (e) => { if (menu.open && !menu.contains(e.target)) menu.open = false })
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.open) menu.open = false })
  }

  // Another tab changed the mode.
  addEventListener('storage', (e) => { if (e.key === KEY) apply(get(), { fresh: true }) })

  apply(get())
})()
