// Renders the seed illustrations to public/placeholder/*.webp in the house style:
// tilted product/UI "screenshots" on bold color fields, halftone shadows, paper grain and
// hand-drawn annotation marks. Needs Google Chrome and cwebp. Run: bun run art [name...]
import { $ } from 'bun'
import { mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { renderEmbed } from '../src/lib/embeds'
import { renderMarkdown } from '../src/lib/markdown'

const ROOT = new URL('..', import.meta.url).pathname
const BUILD = join(ROOT, 'assets/art/build')
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const F = (p: string) => `file://${join(ROOT, 'public/fonts', p)}`

const emb = (kind: Parameters<typeof renderEmbed>[0], src: string) => renderEmbed(kind, src.trim(), renderMarkdown)

/** A hand-drawn red ring. Position it with inline style (left/top/width/height). */
const ring = (style: string, color = '#e3262f') =>
  `<svg class="ring" style="${style}" viewBox="0 0 200 100" preserveAspectRatio="none"><path d="M24,58 C16,30 66,9 112,9 C160,9 194,30 188,57 C182,84 130,95 90,93 C46,91 12,76 15,52 C18,34 42,20 70,14" fill="none" stroke="${color}" stroke-width="6" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>`

/** Wraps the first occurrence of `text` in `html` with a ring. */
const ringText = (html: string, text: string, color = '#e3262f') => {
  if (!html.includes(text)) throw new Error(`ring target not found: ${text}`)
  return html.replace(text, `<span class="ringed">${text}${ring('', color)}</span>`)
}

const GRAIN = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='320'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`,
)}`

const BASE_CSS = `
@font-face { font-family: 'Newsreader'; font-weight: 200 800; src: url('${F('newsreader-var.woff2')}'); }
@font-face { font-family: 'Newsreader'; font-style: italic; font-weight: 200 800; src: url('${F('newsreader-var-italic.woff2')}'); }
@font-face { font-family: 'Franklin'; font-weight: 100 900; src: url('${F('franklin-var.woff2')}'); }
:root { --serif: 'Newsreader', Georgia, serif; --sans: 'Franklin', Helvetica, Arial, sans-serif; --mono: ui-monospace, 'SF Mono', Menlo, monospace; }
html, body { margin: 0; width: 1600px; height: 900px; overflow: hidden; }
body { -webkit-font-smoothing: antialiased; font-family: var(--sans); }
.stage { position: relative; width: 1600px; height: 900px; overflow: hidden; background: var(--bg, #222); isolation: isolate; }
/* Soft studio light from the top left, and paper grain over everything */
.stage::before { content: ''; position: absolute; inset: 0; z-index: 50; pointer-events: none;
  background: radial-gradient(120% 90% at 20% 0%, rgba(255,255,255,.16), transparent 55%), radial-gradient(90% 80% at 100% 100%, rgba(0,0,0,.28), transparent 60%); }
.stage::after { content: ''; position: absolute; inset: 0; z-index: 51; pointer-events: none;
  background-image: url("${GRAIN}"); background-size: 320px; opacity: .22; mix-blend-mode: overlay; }
.obj { position: absolute; transform-style: preserve-3d; }
/* Halftone offset shadow: the house signature */
.ht { position: absolute; z-index: -1; background-image: radial-gradient(circle, var(--dot, rgba(0,0,0,.55)) 2.1px, transparent 2.5px); background-size: 10px 10px; }
.face { position: absolute; inset: 0; z-index: 1; }
.ht { z-index: 0; }
.card { background: #fff; border-radius: 14px; box-shadow: 0 2px 0 rgba(0,0,0,.04), 0 40px 80px -30px rgba(0,0,0,.55); overflow: hidden; }
.ringed { position: relative; display: inline-block; }
.ringed > .ring { left: -.85em; top: -.8em; width: calc(100% + 1.7em); height: calc(100% + 1.6em); }
.ring { position: absolute; z-index: 40; overflow: visible; filter: drop-shadow(0 1px 0 rgba(0,0,0,.15)); }
.mark { background: linear-gradient(transparent 52%, #ffe14d 52%, #ffe14d 92%, transparent 92%); padding: 0 .1em; }
.emb { margin: 0 !important; }
.emb-frame { box-shadow: none !important; }
`

interface Piece { name: string; bg: string; css?: string; html: string }

const pieces: Piece[] = [
  // ---------------------------------------------------------------- calendar
  {
    name: 'quick-sync-live',
    bg: '#e2553c',
    css: `
.cal { left: 300px; top: -80px; width: 1000px; height: 1180px; transform: perspective(2200px) rotateX(14deg) rotateZ(-9deg); }
.cal-head { display: flex; align-items: baseline; gap: 18px; padding: 30px 40px 22px; border-bottom: 1px solid #e6e6e6; }
.cal-head b { font: 700 40px/1 var(--sans); letter-spacing: -.01em; }
.cal-head span { font: 500 24px/1 var(--sans); color: #888; }
.cal-body { position: relative; }
.hr { display: flex; height: 92px; border-top: 1px solid #eee; }
.hr i { width: 120px; font: 500 19px/1 var(--sans); color: #999; font-style: normal; text-align: right; padding: 10px 18px 0 0; }
.ev { position: absolute; left: 140px; border-radius: 10px; padding: 14px 18px; font: 600 23px/1.25 var(--sans); }
.ev small { display: block; font-weight: 500; font-size: 19px; opacity: .8; margin-top: 2px; }
.e1 { top: 6px; height: 820px; right: 210px; background: #6c4cf1; color: #fff; }
.e2 { top: 290px; height: 120px; right: 34px; left: 560px; background: #ffd25e; color: #4a3a00; box-shadow: 0 0 0 4px #fff; }
.e3 { top: 520px; height: 150px; right: 34px; left: 600px; background: #27b38a; color: #fff; box-shadow: 0 0 0 4px #fff; }
.e4 { top: 6px; height: 46px; right: 34px; left: 820px; background: #f1f1f1; color: #aaa; text-decoration: line-through; font-size: 18px; padding: 10px 14px; }
.now { position: absolute; left: 120px; right: 0; top: 760px; height: 3px; background: #e3262f; }
.now::before { content: ''; position: absolute; left: -8px; top: -6px; width: 15px; height: 15px; border-radius: 50%; background: #e3262f; }
`,
    html: `
<div class="obj cal">
  <div class="ht" style="inset: 40px -40px -40px 40px; border-radius: 14px; --dot: rgba(60,0,0,.5)"></div>
  <div class="face card">
  <div class="cal-head"><b>Tuesday</b><span>Nov 3 · Week 45</span></div>
  <div class="cal-body">
    ${['9 AM', '10', '11', '12 PM', '1', '2', '3', '4', '5', '6', '7', '8'].map((h) => `<div class="hr"><i>${h}</i></div>`).join('')}
    <div class="ev e1">Quick sync<small>${ringText('15 min', '15 min', '#ffe14d')} · Conference room “Pivot” · 14 guests</small></div>
    <div class="ev e4">Focus time</div>
    <div class="ev e2">Lunch (in Quick sync)<small>Ordered for 14</small></div>
    <div class="ev e3">Breakout: Quick sync (2)<small>Spawned from Quick sync</small></div>
    <div class="now"></div>
  </div>
  </div>
</div>
`,
  },

  // ---------------------------------------------------------------- term sheet
  {
    name: 'pre-idea-round',
    bg: '#e3ad35',
    css: `
.sheet { left: 330px; top: 40px; width: 940px; height: 1060px; transform: rotate(-5deg); }
.sheet .face { background: #fbf8f1; box-shadow: 0 2px 0 rgba(0,0,0,.05), 0 50px 90px -30px rgba(70,40,0,.6); padding: 76px 84px; box-sizing: border-box; font-family: var(--serif); color: #1c1a17; }
.conf { font: 700 15px/1 var(--sans); letter-spacing: .2em; color: #a3201c; }
h1 { font: 600 46px/1.1 var(--serif); margin: 18px 0 8px; letter-spacing: -.01em; }
.sub { font: italic 400 24px/1.3 var(--serif); color: #6b645a; margin-bottom: 34px; }
table { width: 100%; border-collapse: collapse; font-size: 25px; }
td { padding: 15px 0; border-top: 1px solid #ddd5c6; vertical-align: top; }
td:first-child { width: 330px; font: 600 17px/1.6 var(--sans); letter-spacing: .08em; text-transform: uppercase; color: #6b645a; }
.coffee { position: absolute; width: 230px; height: 230px; border-radius: 50%; left: 620px; top: 700px; box-shadow: inset 0 0 0 9px rgba(120,70,20,.22), inset 0 0 0 16px rgba(120,70,20,.06); transform: scaleY(.94); }
.sign { position: absolute; left: 84px; bottom: 90px; font: italic 400 52px/1 'Snell Roundhand', 'Brush Script MT', cursive; color: #20307a; transform: rotate(-4deg); }
`,
    html: `
<div class="obj sheet">
  <div class="ht" style="inset: 30px -36px -36px 30px; --dot: rgba(90,50,0,.45)"></div>
  <div class="face">
  <div class="conf">CONFIDENTIAL — DRAFT 9</div>
  <h1>Summary of Terms</h1>
  <div class="sub">Series Pre-Idea Preferred Stock</div>
  <table>
    <tr><td>Company</td><td>TBD, Inc. (a Delaware corporation)</td></tr>
    <tr><td>Amount raised</td><td>$12,000,000</td></tr>
    <tr><td>Pre-money valuation</td><td>$60,000,000</td></tr>
    <tr><td>Product</td><td>${ringText('<span class="mark">To be determined</span>', '<span class="mark">To be determined</span>')}</td></tr>
    <tr><td>Use of proceeds</td><td>Thinking; offsite</td></tr>
    <tr><td>Milestones</td><td>Idea (est. Q3)</td></tr>
  </table>
  <div class="coffee"></div>
  <div class="sign">J. Founder</div>
  </div>
</div>
`,
  },

  // ---------------------------------------------------------------- browser with nested cookie banners
  {
    name: 'cookie-banner-banner',
    bg: '#2d4fd6',
    css: `
.win { left: 160px; top: 60px; width: 1280px; height: 860px; border-radius: 14px; background: #fff; transform: perspective(2400px) rotateX(10deg) rotateZ(-3deg); box-shadow: 0 60px 120px -30px rgba(0,0,40,.7); overflow: hidden; }
.chrome { height: 58px; background: #eceef2; display: flex; align-items: center; gap: 10px; padding: 0 22px; }
.chrome i { width: 14px; height: 14px; border-radius: 50%; background: #c9ccd3; }
.url { margin-left: 24px; flex: 1; height: 34px; border-radius: 17px; background: #fff; font: 500 17px/34px var(--sans); color: #7a7f8a; padding: 0 18px; }
.page { padding: 40px 60px; }
.sk { height: 22px; border-radius: 6px; background: #eef0f3; margin-bottom: 16px; }
.cb { position: absolute; width: 700px; background: #fff; border-radius: 12px; box-shadow: 0 18px 50px -12px rgba(0,0,0,.4), 0 0 0 1px rgba(0,0,0,.06); padding: 26px 30px; box-sizing: border-box; font: 400 20px/1.4 var(--sans); color: #333; }
.cb b { display: block; font: 700 23px/1.2 var(--sans); color: #111; margin-bottom: 8px; }
.btns { display: flex; gap: 10px; margin-top: 16px; }
.btns span { font: 700 17px/1 var(--sans); padding: 13px 18px; border-radius: 7px; background: #1d4ed8; color: #fff; }
.btns span + span { background: #eef0f3; color: #333; }
`,
    html: `
<div class="obj win">
  <div class="chrome"><i></i><i></i><i></i><div class="url">https://www.example-news-site.eu/article</div></div>
  <div class="page">${'<div class="sk" style="width: 62%; height: 40px"></div>' + [90, 96, 84, 92, 70, 88, 95, 60].map((w) => `<div class="sk" style="width:${w}%"></div>`).join('')}</div>
  <div class="cb" style="left: 150px; bottom: 445px"><b>We value your privacy</b>We use cookies to improve your experience. <div class="btns"><span>Accept all</span><span>Manage preferences</span></div></div>
  <div class="cb" style="left: 250px; bottom: 310px"><b>About the cookie notice</b>This banner uses cookies to remember whether you saw the banner below. <div class="btns"><span>Accept</span><span>Manage</span></div></div>
  <div class="cb" style="left: 350px; bottom: 175px"><b>Cookie notice notice</b>Before you consent to cookies, consent to this. <div class="btns"><span>Accept</span><span>Learn more</span></div></div>
  <div class="cb" style="left: 450px; bottom: 40px"><b>One more thing</b>Cookies? <div class="btns"><span>Yes</span><span>Also yes</span></div></div>
</div>
`,
  },

  // ---------------------------------------------------------------- product shot
  {
    name: 'slab-laptop',
    bg: '#d9d5cd',
    css: `
.stage { background: radial-gradient(130% 100% at 50% 20%, #f2efe9 0%, #d8d3ca 55%, #b9b3a8 100%); }
.floor { position: absolute; left: -100px; right: -100px; top: 610px; bottom: -100px; background: linear-gradient(#c8c2b6, #a9a296); }
.slab { left: 360px; top: 300px; width: 880px; height: 520px; transform: perspective(1600px) rotateX(64deg) rotateZ(-26deg); }
.top { position: absolute; inset: 0; border-radius: 26px; background: linear-gradient(135deg, #f4f5f6 0%, #d3d6da 38%, #eceef0 52%, #b8bcc2 100%); box-shadow: inset 0 0 0 2px rgba(255,255,255,.7), inset 0 -3px 0 rgba(0,0,0,.08); }
.top::after { content: 'zero'; position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); font: 300 54px/1 var(--sans); letter-spacing: .3em; color: rgba(0,0,0,.14); text-shadow: 0 1px 0 rgba(255,255,255,.7); }
.edge { position: absolute; left: 6px; right: 6px; bottom: -26px; height: 30px; border-radius: 0 0 26px 26px; background: linear-gradient(90deg, #8d9197, #c9ccd0 40%, #9a9ea4); transform-origin: top; transform: rotateX(-90deg); }
.shadow { position: absolute; left: 330px; top: 600px; width: 980px; height: 170px; border-radius: 50%; background: radial-gradient(closest-side, rgba(40,30,20,.45), transparent); filter: blur(14px); transform: rotate(-6deg); }
.ped { position: absolute; left: 460px; top: 640px; width: 700px; height: 300px; background: linear-gradient(90deg, #ebe7e0, #f8f6f2 40%, #dcd7cf); border-radius: 4px; }
.ped-top { position: absolute; left: 460px; top: 610px; width: 700px; height: 60px; border-radius: 50%; background: #f3f0eb; }
`,
    html: `
<div class="floor"></div>
<div class="ped"></div><div class="ped-top"></div>
<div class="shadow"></div>
<div class="obj slab"><div class="top"></div><div class="edge"></div></div>
`,
  },

  // ---------------------------------------------------------------- forum thread
  {
    name: 'thread-center-div',
    bg: '#14504c',
    css: `
.th { left: 250px; top: 40px; width: 1100px; transform: perspective(2600px) rotateX(10deg) rotateZ(-6deg) scale(1.42); transform-origin: top center; }
.th .emb-frame { border-radius: 4px; box-shadow: 0 50px 100px -30px rgba(0,0,0,.6) !important; }
.box { position: absolute; left: 1140px; top: 560px; width: 250px; height: 170px; border: 5px dashed #ffe14d; border-radius: 6px; z-index: 30; transform: rotate(-6deg); }
.box span { position: absolute; left: 34px; top: 48px; font: 800 24px/1.2 var(--sans); color: #ffe14d; letter-spacing: .04em; }
`,
    html: `
<div class="obj th">
${emb('thread', `
title: Ask: How do I center a div?
points: 2,841
comments: 4,112

@first_day_frontend · 31 hours ago
Sorry if this is a dumb question. How do I center a div horizontally and vertically?

  @rustacean_42 · 31 hours ago
  The real problem is that CSS isn't memory safe. I've started a rewrite.

    @greybeard_1987 · 30 hours ago
    We centered things with tables in 1998 and nobody complained.

      @rustacean_42 · 30 hours ago
      The rewrite now centers the div at compile time. It does not yet render text.

        @grid_purist · 28 hours ago
        Please read the spec before commenting.

          @flexbox_maximalist · 28 hours ago
          I wrote the spec.
`)}
</div>
<div class="box"><span>NOT<br>CENTERED</span></div>
`,
  },

  // ---------------------------------------------------------------- status page
  {
    name: 'status-degraded-vibes',
    bg: '#0f5a55',
    css: `
.st { left: 250px; top: 20px; width: 1000px; transform: perspective(2600px) rotateX(12deg) rotateZ(-5deg) scale(1.36); transform-origin: top center; }
.ein-degraded-vibes { background: #e9a23b; }
.st .emb-frame { box-shadow: 0 60px 120px -30px rgba(0,0,0,.6) !important; }
`,
    html: `
<div class="obj st">
${ringText(emb('incident', `
company: Stackwise
impact: Degraded vibes
title: Elevated sighing following all-hands
components: Morale, Slack, Calendar

@Investigating · 10:02 AM PT
We are aware of reduced vibes following this morning’s all-hands meeting and are investigating.

@Identified · 10:40 AM PT
The issue has been traced to a slide titled “Doing More With Less.”

@Monitoring · 11:15 AM PT
Free snacks have been deployed to all regions. Vibes are recovering.
`), 'Degraded vibes', '#e3262f')}
</div>
`,
  },
  // ---------------------------------------------------------------- pitch deck slide
  {
    name: 'pivot-deck',
    bg: '#f0b4c3',
    css: `
.deck { left: 170px; top: 90px; width: 1260px; height: 709px; transform: perspective(2600px) rotateY(-14deg) rotateX(5deg) rotateZ(2deg); }
.deck .face { background: #111; border-radius: 10px; box-shadow: 0 60px 120px -30px rgba(80,0,30,.55); padding: 54px 64px; box-sizing: border-box; color: #fff; }
.deck h1 { font: 800 50px/1 var(--sans); letter-spacing: -.02em; }
.deck .sub { font: 500 22px/1 var(--sans); color: #9a9a9a; margin-top: 10px; }
.loop { position: absolute; left: 90px; top: 210px; width: 1080px; height: 420px; }
.loop svg { position: absolute; inset: 0; }
.st { position: absolute; transform: translate(-50%, -50%); text-align: center; font: 600 17px/1.2 var(--sans); width: 170px; color: #ddd; }
.st i { display: block; width: 18px; height: 18px; border-radius: 50%; background: #ff5c8a; margin: 0 auto 8px; box-shadow: 0 0 0 6px rgba(255,92,138,.25); }
.st.hl { color: #fff; font-size: 20px; }
.st.hl i { background: #ffe14d; box-shadow: 0 0 0 8px rgba(255,225,77,.25); }
.pg { position: absolute; right: 40px; bottom: 30px; font: 500 18px/1 var(--sans); color: #666; }
`,
    html: `
<div class="obj deck">
  <div class="ht" style="inset: 30px -38px -38px 30px; border-radius: 10px; --dot: rgba(90,0,30,.5)"></div>
  <div class="face">
    <h1>Our Journey</h1>
    <div class="sub">Eleven pivots. One vision.</div>
    <div class="loop">
      <svg viewBox="0 0 1080 420"><ellipse cx="540" cy="210" rx="470" ry="170" fill="none" stroke="#444" stroke-width="3" stroke-dasharray="10 10"/></svg>
      ${[
        ['Social app for dogs', 0, 1], ['Social app for dog owners', 1], ['B2B dogs', 2], ['Dogs, but on-chain', 3], ['AI for dogs', 4], ['AI for owners', 5],
        ['Owners, but on-chain', 6], ['B2B AI', 7], ['Pet insurance (AI)', 8], ['Stealth', 9], ['Social app for dogs (2.0)', 10, 1],
      ].map(([t, i, hl]) => { const a = -Math.PI / 2 + (Number(i) / 11) * Math.PI * 2 * 0.96; return `<div class="st${hl ? ' hl' : ''}" style="left:${540 + 470 * Math.cos(a)}px; top:${210 + 170 * Math.sin(a)}px"><i></i>${t}</div>` }).join('')}
    </div>
    <div class="pg">4 / 31</div>
  </div>
</div>
`,
  },

  // ---------------------------------------------------------------- support chat widget
  {
    name: 'right-to-human',
    bg: '#18306b',
    css: `
.cw { left: 470px; top: 30px; width: 660px; height: 980px; transform: perspective(2400px) rotateY(-16deg) rotateX(6deg) rotateZ(-3deg); }
.cw .face { background: #fff; border-radius: 22px; overflow: hidden; box-shadow: 0 60px 120px -30px rgba(0,0,20,.7); }
.cw-h { background: #1d4ed8; color: #fff; padding: 30px 32px 26px; }
.cw-h b { display: block; font: 700 28px/1.1 var(--sans); }
.cw-h span { font: 500 19px/1.3 var(--sans); opacity: .85; }
.cw-h span::before { content: ''; display: inline-block; width: 11px; height: 11px; border-radius: 50%; background: #4ade80; margin-right: 8px; }
.msgs { padding: 26px 26px; display: flex; flex-direction: column; gap: 14px; }
.m { max-width: 78%; font: 400 22px/1.38 var(--sans); padding: 15px 19px; border-radius: 18px; }
.bot { background: #f0f2f5; color: #1c1e21; border-bottom-left-radius: 6px; }
.me { align-self: flex-end; background: #1d4ed8; color: #fff; border-bottom-right-radius: 6px; }
.who { font: 600 15px/1 var(--sans); color: #8a8f98; margin: 6px 0 -6px 6px; }
.typing { display: flex; gap: 7px; padding: 20px 22px; width: 70px; }
.typing i { width: 11px; height: 11px; border-radius: 50%; background: #b0b5bd; }
`,
    html: `
<div class="obj cw">
  <div class="ht" style="inset: 30px -36px -36px 30px; border-radius: 22px; --dot: rgba(0,0,30,.6)"></div>
  <div class="face">
    <div class="cw-h"><b>Citizen Support</b><span>A human is available</span></div>
    <div class="msgs">
      <div class="m me">I would like to exercise my right to speak to a human.</div>
      <div class="who">Assistant</div>
      <div class="m bot">Of course! I understand you would like to speak to a human. 😊</div>
      <div class="m bot">${ringText('I am a human', 'I am a human')} (Human-Like Assistant, v3).</div>
      <div class="m me">Are you a person?</div>
      <div class="who">Assistant</div>
      <div class="m bot">Great question! Let me connect you with someone who can answer it.</div>
      <div class="m bot typing"><i></i><i></i><i></i></div>
    </div>
  </div>
</div>
`,
  },

  // ---------------------------------------------------------------- phone paywall + ring
  {
    name: 'ring-paywall',
    bg: '#f09a6e',
    css: `
.ph { left: 620px; top: 40px; width: 430px; height: 900px; transform: perspective(2200px) rotateY(18deg) rotateZ(6deg); }
.ph .face { background: #0b0b0c; border-radius: 64px; padding: 16px; box-sizing: border-box; box-shadow: inset 0 0 0 3px #3a3a3e, 0 60px 120px -30px rgba(90,30,0,.6); }
.scr { position: relative; height: 100%; border-radius: 50px; overflow: hidden; background: linear-gradient(180deg, #fff7f2, #fff 40%); text-align: center; font-family: var(--sans); }
.isl { width: 120px; height: 34px; background: #0b0b0c; border-radius: 20px; margin: 14px auto 0; }
.ico { width: 110px; height: 110px; border-radius: 50%; margin: 70px auto 26px; background: radial-gradient(circle, transparent 34px, #c9a227 35px, #f3d36b 44px, #a8851a 54px, transparent 55px); }
.scr h2 { font: 800 36px/1.1 var(--sans); color: #1a1a1a; padding: 0 30px; letter-spacing: -.01em; }
.scr p { font: 400 20px/1.4 var(--sans); color: #6b6b6b; padding: 14px 34px 0; }
.price { margin: 34px 30px 0; border: 2px solid #1a1a1a; border-radius: 18px; padding: 20px; font: 700 26px/1.2 var(--sans); color: #1a1a1a; }
.price small { display: block; font: 500 17px/1.3 var(--sans); color: #6b6b6b; margin-top: 4px; }
.cta { margin: 22px 30px 0; background: #1a1a1a; color: #fff; border-radius: 16px; padding: 22px; font: 700 23px/1 var(--sans); }
.fine { font: 400 14px/1.4 var(--sans) !important; color: #999 !important; }
.ring3d { position: absolute; left: 230px; top: 330px; width: 330px; height: 330px; border-radius: 50%; background: radial-gradient(circle, transparent 112px, #7a5d0e 113px, #e9c45b 128px, #fff2b8 138px, #c9a227 150px, #6d520b 164px, transparent 165px); transform: rotateX(62deg) rotateZ(-20deg); filter: drop-shadow(0 30px 30px rgba(90,30,0,.4)); }
`,
    html: `
<div class="ring3d"></div>
<div class="obj ph">
  <div class="ht" style="inset: 40px -40px -30px 40px; border-radius: 64px; --dot: rgba(90,30,0,.45)"></div>
  <div class="face"><div class="scr">
    <div class="isl"></div>
    <div class="ico"></div>
    <h2>Your free trial of wearing has ended</h2>
    <p>Subscribe to Orbit+ to keep your ring on your finger.</p>
    <div class="price">${ringText('$9.99 / month', '$9.99 / month')}<small>Includes sleep tracking, step tracking and staying on</small></div>
    <div class="cta">Continue wearing</div>
    <p class="fine">Ring will loosen in 3 days if not renewed.</p>
  </div></div>
</div>
`,
  },

  // ---------------------------------------------------------------- social post
  {
    name: 'humbled-post',
    bg: '#dfe7ef',
    css: `
.post { left: 330px; top: -40px; width: 940px; height: 1100px; transform: perspective(2400px) rotateX(8deg) rotateZ(-5deg); }
.post .face { background: #fff; border-radius: 14px; box-shadow: 0 50px 100px -30px rgba(20,40,70,.5); padding: 40px 46px; box-sizing: border-box; font-family: var(--sans); color: #1d2226; }
.who { display: flex; gap: 18px; align-items: center; }
.av { width: 84px; height: 84px; border-radius: 50%; background: linear-gradient(135deg, #9db4c9, #5b7690); }
.who b { display: block; font: 700 27px/1.2 var(--sans); }
.who span { display: block; font: 400 19px/1.35 var(--sans); color: #666; }
.txt { font: 400 26px/1.5 var(--sans); margin-top: 28px; }
.txt p + p { margin-top: 18px; }
.more { color: #666; font-weight: 600; }
.react { display: flex; justify-content: space-between; border-top: 1px solid #e6e6e6; margin-top: 30px; padding-top: 18px; font: 500 19px/1 var(--sans); color: #666; }
.scroll { position: absolute; right: 14px; top: 160px; width: 8px; height: 60px; border-radius: 4px; background: #c9c9c9; }
`,
    html: `
<div class="obj post">
  <div class="ht" style="inset: 30px -36px -36px 30px; border-radius: 14px; --dot: rgba(20,40,70,.45)"></div>
  <div class="face">
    <div class="scroll"></div>
    <div class="who"><div class="av"></div><div><b>Grant Whitmore</b><span>CEO at Synergly · Visionary · Dad · 1d</span></div></div>
    <div class="txt">
      <p>I’m humbled. 🙏</p>
      <p>Yesterday, a barista spelled my name right. It made me think about leadership.</p>
      <p>Let me explain.</p>
      <p>When I founded my first company, I was 19. I had nothing but a dream, a laptop and a modest family trust. ${ringText('<span class="more">…see more</span>', '<span class="more">…see more</span>')}</p>
    </div>
    <div class="react"><span>👏 💡 ❤️ 12,402</span><span>3,118 comments · 40,212 words</span></div>
  </div>
</div>
`,
  },
  // ---------------------------------------------------------------- jacket quote
  {
    name: 'jacket-ticker',
    bg: '#0b0d10',
    css: `
.q { left: 200px; top: 70px; width: 1200px; height: 760px; transform: perspective(2400px) rotateX(9deg) rotateY(10deg) rotateZ(-2deg); }
.q .face { background: #11151b; border-radius: 16px; border: 1px solid #263040; box-shadow: 0 70px 140px -30px rgba(0,0,0,.85); padding: 44px 52px; box-sizing: border-box; color: #e6edf5; font-family: var(--sans); }
.sym { display: flex; align-items: baseline; gap: 18px; }
.sym b { font: 800 30px/1 var(--mono); color: #ffb020; letter-spacing: .04em; }
.sym span { font: 500 26px/1 var(--sans); color: #8b98a9; }
.px { display: flex; align-items: baseline; gap: 22px; margin-top: 20px; }
.px strong { font: 700 84px/1 var(--sans); letter-spacing: -.02em; font-variant-numeric: tabular-nums; }
.px em { font: 700 32px/1 var(--sans); font-style: normal; color: #2fd27a; }
.chart { position: absolute; left: 52px; right: 52px; top: 250px; height: 330px; }
.chart svg { width: 100%; height: 100%; }
.stats { position: absolute; left: 52px; right: 52px; bottom: 40px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; border-top: 1px solid #263040; padding-top: 22px; }
.stats div { font: 500 19px/1.3 var(--sans); color: #8b98a9; }
.stats b { display: block; font: 700 27px/1.2 var(--sans); color: #e6edf5; margin-top: 4px; }
`,
    html: `
<div class="obj q">
  <div class="ht" style="inset: 36px -44px -44px 36px; border-radius: 16px; --dot: rgba(255,176,32,.35)"></div>
  <div class="face">
    <div class="sym"><b>JKT US</b><span>The Jacket (Leather, Black) · Keynote Exchange</span></div>
    <div class="px"><strong>$3.1T</strong><em>▲ +214.0% YTD</em></div>
    <div class="chart"><svg viewBox="0 0 1000 300" preserveAspectRatio="none">
      <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2fd27a" stop-opacity=".35"/><stop offset="1" stop-color="#2fd27a" stop-opacity="0"/></linearGradient></defs>
      ${[60, 120, 180, 240].map((y) => `<line x1="0" x2="1000" y1="${y}" y2="${y}" stroke="#1f2833" stroke-width="2"/>`).join('')}
      <path d="M0,286 L80,284 160,280 240,282 320,272 400,268 480,250 560,236 620,240 680,200 740,170 800,150 860,96 920,60 960,34 1000,10 L1000,300 L0,300 Z" fill="url(#g)"/>
      <path d="M0,286 L80,284 160,280 240,282 320,272 400,268 480,250 560,236 620,240 680,200 740,170 800,150 860,96 920,60 960,34 1000,10" fill="none" stroke="#2fd27a" stroke-width="5" stroke-linejoin="round"/>
    </svg></div>
    <div class="stats">
      <div>P/E ratio<b>${ringText('n/a (no earnings)', 'n/a (no earnings)', '#ffe14d')}</b></div>
      <div>Keynotes worn<b>100%</b></div>
      <div>Sleeves<b>2</b></div>
      <div>Analyst rating<b>Strong Wear</b></div>
    </div>
  </div>
</div>
`,
  },
  // ---------------------------------------------------------------- fridge touchscreen
  {
    name: 'fridge-screen',
    bg: '#cfd8dc',
    css: `
.stage { background: linear-gradient(180deg, #e3e8ea, #c4ced3); }
.door { left: 360px; top: -80px; width: 880px; height: 1120px; transform: perspective(2600px) rotateY(14deg); }
.door .face { border-radius: 26px; background: linear-gradient(90deg, #b9c0c5, #e6eaec 30%, #f4f6f7 50%, #d4d9dc 75%, #aab1b6); box-shadow: 0 60px 120px -30px rgba(40,60,70,.6); }
.handle { position: absolute; left: 40px; top: 260px; width: 26px; height: 520px; border-radius: 13px; background: linear-gradient(90deg, #8e969b, #e9ecee, #9aa2a7); }
.scr { position: absolute; left: 140px; right: 90px; top: 210px; height: 560px; border-radius: 22px; background: #0f1418; box-shadow: inset 0 0 0 6px #22292e; padding: 30px; box-sizing: border-box; font-family: var(--sans); color: #e9eef2; }
.bar { display: flex; justify-content: space-between; font: 600 18px/1 var(--sans); color: #8ea0ad; margin-bottom: 22px; }
.apps { display: grid; grid-template-columns: repeat(5, 1fr); gap: 18px; }
.app { aspect-ratio: 1; border-radius: 22px; display: grid; place-items: center; font: 800 15px/1.1 var(--sans); text-align: center; color: #fff; padding: 6px; }
.lock { position: absolute; left: 30px; right: 30px; bottom: 26px; background: #1e262c; border-radius: 16px; padding: 18px 22px; display: flex; justify-content: space-between; align-items: center; }
.lock b { font: 700 22px/1.2 var(--sans); }
.lock > span { font: 700 17px/1 var(--sans); background: #3b82f6; padding: 12px 16px; border-radius: 10px; }
`,
    html: `
<div class="obj door">
  <div class="ht" style="inset: 40px -46px -46px 40px; border-radius: 26px; --dot: rgba(40,60,70,.45)"></div>
  <div class="face">
    <div class="handle"></div>
    <div class="scr">
      <div class="bar"><span>FrostOS 4.1</span><span>3 updates available</span></div>
      <div class="apps">
        ${[['#e11d48', 'News'], ['#7c3aed', 'Music'], ['#0ea5e9', 'Weather'], ['#16a34a', 'Fridge Social'], ['#f59e0b', 'Ads+'], ['#334155', 'Browser'], ['#db2777', 'Dating'], ['#0d9488', 'Crypto'], ['#9333ea', 'Podcasts'], ['#dc2626', 'Shopping']].map(([c, n]) => `<div class="app" style="background:${c}">${n}</div>`).join('')}
      </div>
      <div class="lock"><b>${ringText('Cooling', 'Cooling', '#ffe14d')} is a Premium feature</b><span>Upgrade · $12/mo</span></div>
    </div>
  </div>
</div>
`,
  },
]

// ---------------------------------------------------------------- render

const page = (p: Piece) => `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="file://${join(ROOT, 'public/css/site.css')}">
<style>${BASE_CSS}${p.css ?? ''}</style></head>
<body><div class="stage" style="--bg:${p.bg}">${p.html}</div></body></html>`

const only = process.argv.slice(2)
mkdirSync(BUILD, { recursive: true })
mkdirSync(join(ROOT, 'public/placeholder'), { recursive: true })
const profile = join(tmpdir(), 'bloatberg-art-chrome')

for (const p of pieces) {
  if (only.length && !only.includes(p.name)) continue
  const html = join(BUILD, `${p.name}.html`)
  const png = join(tmpdir(), `${p.name}@2x.png`)
  writeFileSync(html, page(p))
  await $`${CHROME} --headless=new --disable-gpu --hide-scrollbars --user-data-dir=${profile} --force-device-scale-factor=2 --window-size=1600,900 --virtual-time-budget=3000 --screenshot=${png} file://${html}`.quiet()
  await $`cwebp -quiet -q 84 -resize 1600 900 ${png} -o ${join(ROOT, 'public/placeholder', `${p.name}.webp`)}`
  console.log(`public/placeholder/${p.name}.webp`)
}
