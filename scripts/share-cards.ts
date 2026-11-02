// Renders 1200×630 share cards for the seed articles to public/placeholder/share/<slug>.webp.
// Same design the CMS draws in the browser (public/admin/editor.js → drawCard). Needs Chrome + cwebp.
// Run: bun run share-cards [slug…]
import { $ } from 'bun'
import { mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { sectionName, site } from '../src/config'
import { reviewScore } from '../src/lib/embeds'
import { articles, type SeedArticle } from './seed-content'

const ROOT = new URL('..', import.meta.url).pathname
const OUT = join(ROOT, 'public/placeholder/share')
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const F = (p: string) => `file://${join(ROOT, 'public/fonts', p)}`
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function kicker(a: SeedArticle) {
  const m = /```review\s*\n([\s\S]*?)```/.exec(a.body)
  const score = m ? reviewScore(m[1]!) : null
  const fmt = a.format ?? 'story'
  const section = sectionName(a.section).toUpperCase()
  const label = (a.label ?? '').toUpperCase()
  // "REVIEW · REVIEWS" would repeat itself.
  const parts = [fmt === 'live' ? 'LIVE' : fmt === 'brief' ? 'IN BRIEF' : '', `${label}S` === section ? '' : label, section, score !== null ? `${score}/10` : '']
  return [...new Set(parts.filter(Boolean))].join('  ·  ')
}

/** Shrinks the headline until it fits in `max` lines, like the canvas version. */
const FIT = `
const h = document.querySelector('.hl'), max = Number(h.dataset.max), sizes = h.dataset.sizes.split(',').map(Number)
for (const s of sizes) { h.style.fontSize = s + 'px'; if (h.getBoundingClientRect().height <= s * 1.12 * max + 2) break }
`

function page(a: SeedArticle) {
  const brief = (a.format ?? 'story') === 'brief'
  const css = `
@font-face { font-family: 'Newsreader'; font-weight: 200 800; src: url('${F('newsreader-var.woff2')}'); }
@font-face { font-family: 'Franklin'; font-weight: 100 900; src: url('${F('franklin-var.woff2')}'); }
@font-face { font-family: 'Nameplate'; font-weight: 700; src: url('${F('nameplate.woff2')}'); }
html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; background: #fff; -webkit-font-smoothing: antialiased; }
.np { font: 700 26px/1 'Nameplate'; letter-spacing: 2px; color: #121212; text-transform: uppercase; }
.k { font: 700 17px/1 'Franklin'; letter-spacing: 2px; color: #c8102e; white-space: pre; }
.hl { font-family: 'Newsreader'; font-weight: 600; line-height: 1.12; color: #121212; margin: 0; letter-spacing: -0.01em; }
.story .pic { position: absolute; left: 0; top: 0; width: 1200px; height: 382px; object-fit: cover; }
.story .bar { position: absolute; left: 0; top: 382px; width: 1200px; height: 6px; background: #c8102e; }
.story .meta { position: absolute; left: 56px; top: 412px; display: flex; align-items: baseline; gap: 16px; }
.story .hl { position: absolute; left: 56px; right: 56px; top: 452px; }
.brief .top { position: absolute; left: 0; top: 0; right: 0; height: 10px; background: #c8102e; }
.brief .np { position: absolute; left: 72px; top: 64px; font-size: 34px; }
.brief .k { position: absolute; left: 72px; top: 150px; font-size: 22px; letter-spacing: 3px; }
.brief .hl { position: absolute; left: 72px; right: 72px; top: 200px; line-height: 1.1; }
.brief .rule { position: absolute; left: 72px; right: 72px; bottom: 78px; height: 1px; background: #e5e5e5; }
.brief .date { position: absolute; left: 72px; bottom: 30px; font: 500 22px/1 'Franklin'; color: #5c5c5c; }
`
  const body = brief
    ? `<div class="brief"><div class="top"></div><div class="np">${esc(site.name)}</div><div class="k">${esc(kicker(a))}</div>
<p class="hl" data-max="4" data-sizes="78,72,66,60,54,48,44,40">${esc(a.title)}</p><div class="rule"></div>
<div class="date">${new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date())}</div></div>`
    : `<div class="story"><img class="pic" src="file://${join(ROOT, 'public', a.image)}"><div class="bar"></div>
<div class="meta"><span class="np">${esc(site.name)}</span><span class="k">·  ${esc(kicker(a))}</span></div>
<p class="hl" data-max="3" data-sizes="46,43,40,37,34,31,29">${esc(a.title)}</p></div>`
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${body}<script>document.fonts.ready.then(() => {${FIT}})</script></body></html>`
}

const only = process.argv.slice(2)
mkdirSync(OUT, { recursive: true })
const profile = join(tmpdir(), 'bloatberg-share-chrome')
for (const a of articles) {
  if (only.length && !only.includes(a.slug)) continue
  if ((a.format ?? 'story') !== 'brief' && !a.image) continue
  const html = join(tmpdir(), `share-${a.slug}.html`)
  const png = join(tmpdir(), `share-${a.slug}.png`)
  writeFileSync(html, page(a))
  await $`${CHROME} --headless=new --disable-gpu --hide-scrollbars --user-data-dir=${profile} --force-device-scale-factor=1 --window-size=1200,630 --virtual-time-budget=3000 --screenshot=${png} file://${html}`.quiet()
  await $`cwebp -quiet -q 86 ${png} -o ${join(OUT, `${a.slug}.webp`)}`
  console.log(`public/placeholder/share/${a.slug}.webp`)
}
