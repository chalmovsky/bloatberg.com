import type { Child } from 'hono/jsx'
import { raw } from 'hono/html'
import { site } from '../config'
import { articlePath, type PublishedStory } from '../db/articles'
import { isoDate, longDate, nowSeconds, relativeTime } from '../lib/dates'
import { asset } from '../lib/assets'
import { quotes } from '../lib/markets'
import { MenuIcon, SearchIcon, ThemeIcon } from './components/icons'

/**
 * Runs in <head> before the page paints, so a saved mode never flashes the default colours.
 * Defines window.bbTheme(mode, seed?) for /js/theme.js. "random" builds a palette from one
 * number (shown on the page as the theme seed); OKLCH keeps the contrast steady at any hue.
 */
const THEME_BOOT = `(function(){var d=document.documentElement;
var L={bg:[.975,.03],'bg-soft':[.935,.045],text:[.2,.045],'ink-2':[.3,.045],muted:[.45,.05],faint:[.52,.05],rule:[.88,.035],'rule-2':[.8,.045],'rule-strong':[.2,.045],'img-bg':[.9,.035],'footer-bg':[.23,.06],'footer-text':[.96,.02],'footer-muted':[.74,.035]};
var D={bg:[.19,.035],'bg-soft':[.23,.045],text:[.95,.02],'ink-2':[.86,.03],muted:[.74,.04],faint:[.64,.04],rule:[.3,.035],'rule-2':[.4,.045],'rule-strong':[.95,.02],'img-bg':[.26,.035],'footer-bg':[.14,.035],'footer-text':[.95,.02],'footer-muted':[.7,.035]};
function pal(s){var h=s%360,a=(h+120+(s>>9)%120)%360,dk=(s>>3)%5<2,c=dk?D:L;
for(var k in c)d.style.setProperty('--'+k,'oklch('+c[k][0]+' '+c[k][1]+' '+h+')');
d.style.setProperty('--accent',dk?'oklch(.68 .19 '+a+')':'oklch(.52 .2 '+a+')');
d.style.colorScheme=dk?'dark':'light';d.dataset.seed=s}
window.bbTheme=function(t,s){d.removeAttribute('style');delete d.dataset.seed;
if(!t||t==='system'){delete d.dataset.theme;return}
d.dataset.theme=t;if(t==='random')pal(s==null?Math.floor(Math.random()*65536):s)};
try{window.bbTheme(localStorage.getItem('bb-theme'))}catch(e){}})()`

export const THEMES = [
  ['system', 'System'],
  ['light', 'Light'],
  ['dark', 'Dark'],
  ['random', 'Random'],
  ['enterprise', 'Enterprise'],
  ['ai', 'AI'],
] as const

/** Appearance buttons. Hidden until /js/theme.js runs, since they need it. */
function ThemeOptions() {
  return (
    <div class="theme-opts" role="group" aria-label="Appearance">
      {THEMES.map(([value, name]) => (
        <button type="button" data-theme-set={value} aria-pressed="false">{name}</button>
      ))}
    </div>
  )
}

export interface Meta {
  title?: string // page title; site name is appended
  description?: string
  path: string // canonical path
  image?: string // absolute or root-relative
  imageAlt?: string
  imageSize?: [number, number]
  /** Load the share-menu script (article pages). */
  shareScript?: boolean
  type?: 'website' | 'article'
  article?: { publishedTime: string; modifiedTime: string; section: string; author: string }
  noindex?: boolean
}

interface Props {
  siteUrl: string
  meta: Meta
  activeSection?: string
  /** 'front' = full nameplate and market strip (home page); 'compact' = slim header (everything else). */
  variant?: 'front' | 'compact'
  /** Active live coverage, shown as a bar under the masthead. */
  alert?: PublishedStory | null
  children: Child
}

const abs = (siteUrl: string, p: string) => (/^https?:/.test(p) ? p : new URL(p, siteUrl).toString())

export function Layout({ siteUrl, meta, activeSection, variant = 'compact', alert, children }: Props) {
  const title = meta.title ? `${meta.title} | ${site.name}` : `${site.name} — ${site.tagline}`
  const description = meta.description || site.description
  const canonical = abs(siteUrl, meta.path)
  // Every page gets a share card; pages without their own picture use the site card.
  const image = abs(siteUrl, meta.image || '/og-default.png')
  const showAlert = alert && articlePath(alert) !== meta.path

  return (
    <>
      {raw('<!doctype html>')}
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>{title}</title>
          <meta name="description" content={description} />
          <link rel="canonical" href={canonical} />
          {meta.noindex && <meta name="robots" content="noindex" />}

          <meta property="og:site_name" content={site.name} />
          <meta property="og:type" content={meta.type ?? 'website'} />
          <meta property="og:title" content={meta.title ?? site.name} />
          <meta property="og:description" content={description} />
          <meta property="og:url" content={canonical} />
          <meta property="og:locale" content="en_US" />
          {image && <meta property="og:image" content={image} />}
          {image && meta.imageAlt && <meta property="og:image:alt" content={meta.imageAlt} />}
          {(meta.imageSize ?? (meta.image ? undefined : [1200, 630])) && (
            <>
              <meta property="og:image:width" content={String((meta.imageSize ?? [1200, 630])[0])} />
              <meta property="og:image:height" content={String((meta.imageSize ?? [1200, 630])[1])} />
            </>
          )}
          {meta.article && (
            <>
              <meta property="article:published_time" content={meta.article.publishedTime} />
              <meta property="article:modified_time" content={meta.article.modifiedTime} />
              <meta property="article:section" content={meta.article.section} />
              <meta property="article:author" content={meta.article.author} />
              <meta name="author" content={meta.article.author} />
            </>
          )}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={meta.title ?? site.name} />
          <meta name="twitter:description" content={description} />
          {image && <meta name="twitter:image" content={image} />}
          {image && meta.imageAlt && <meta name="twitter:image:alt" content={meta.imageAlt} />}

          <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
          <link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
          <link rel="manifest" href="/site.webmanifest" />
          <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
          <meta name="theme-color" content="#121212" media="(prefers-color-scheme: dark)" />
          <link rel="alternate" type="application/rss+xml" title={site.name} href="/feed.xml" />
          <link rel="preload" href="/fonts/newsreader-var.woff2" as="font" type="font/woff2" crossorigin="" />
          <link rel="preload" href="/fonts/franklin-var.woff2" as="font" type="font/woff2" crossorigin="" />
          <link rel="preload" href="/fonts/nameplate.woff2" as="font" type="font/woff2" crossorigin="" />
          <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
          <link rel="stylesheet" href={asset('/css/site.css')} />
          <script src={asset('/js/theme.js')} defer></script>
          {meta.shareScript && <script src={asset('/js/share.js')} defer></script>}
        </head>
        <body class={`v-${variant}`}>
          <a class="skip" href="#main">Skip to content</a>
          <Masthead activeSection={activeSection} variant={variant} />
          {showAlert && <LiveAlert story={alert} />}
          <main id="main">{children}</main>
          <Footer />
        </body>
      </html>
    </>
  )
}

const MORE_LINKS = [
  { href: '/briefs', name: 'In Brief' },
  { href: '/newsletter', name: 'Newsletters' },
  { href: '/tips', name: 'Send a Tip' },
]

function Masthead({ activeSection, variant }: { activeSection?: string; variant: 'front' | 'compact' }) {
  const now = nowSeconds()
  const qs = quotes(now)
  const lead = qs[0]!
  const agi = qs.find((q) => q.dir === 'flat')
  return (
    <header class="masthead">
      <div class="utility">
        <div class="wrap utility-inner">
          <div class="utility-left">
            <SectionsMenu />
            <a class="utility-btn" href="/search">
              <SearchIcon />
              <span class="utility-label">Search</span>
            </a>
          </div>
          {variant === 'compact' && (
            <a class="nameplate nameplate-compact" href="/" aria-label={`${site.name} home`}>{site.name}</a>
          )}
          <div class="utility-right">
            <details class="theme-menu" hidden>
              <summary class="utility-btn theme-btn" aria-label="Appearance" title="Appearance">
                <ThemeIcon />
              </summary>
              <div class="theme-panel">
                <p class="menu-h">Appearance</p>
                <ThemeOptions />
              </div>
            </details>
            <a class="utility-link" href="/newsletter">Newsletters</a>
            <a class="btn-subscribe" href="/newsletter">
              Subscribe<span class="btn-subscribe-price"> for $0</span>
            </a>
          </div>
        </div>
      </div>

      {variant === 'front' && (
        <div class="wrap nameplate-row">
          <div class="np-side np-left">
            <time class="np-date" datetime={isoDate(now)}>{longDate(now)}</time>
            <span class="np-edition">Today’s Edition · Est. {site.founded}</span>
          </div>
          <a class="nameplate" href="/" aria-label={`${site.name} home`}>{site.name}</a>
          <div class="np-side np-right">
            <span class="np-quote">
              {lead.name} <strong>{lead.value}</strong> <span class={`q-${lead.dir}`}>{lead.dir === 'up' ? '▲' : '▼'} {lead.change}</span>
            </span>
            {agi && (
              <span class="np-quote np-quote-sub">
                {agi.name}: {agi.value} <span class="q-flat">({agi.change})</span>
              </span>
            )}
          </div>
        </div>
      )}

      <nav class={`sections sections-${variant}`} aria-label="Sections">
        <div class="wrap sections-inner">
          {site.sections.map((s) => (
            <a href={`/section/${s.slug}`} class={activeSection === s.slug ? 'active' : undefined}
              aria-current={activeSection === s.slug ? 'page' : undefined}>
              {s.name}
            </a>
          ))}
          <span class="sections-sep" aria-hidden="true"></span>
          {MORE_LINKS.map((l) => (
            <a href={l.href} class={activeSection === l.href ? 'active more' : 'more'}>{l.name}</a>
          ))}
        </div>
      </nav>
      {variant === 'front' && <Ticker />}
    </header>
  )
}

function SectionsMenu() {
  return (
    <details class="menu">
      <summary class="utility-btn" aria-label="Sections menu">
        <MenuIcon />
        <span class="utility-label">Sections</span>
      </summary>
      <div class="menu-panel">
        <div class="menu-col">
          <p class="menu-h">News</p>
          {site.sections.map((s) => (
            <a href={`/section/${s.slug}`}>{s.long}</a>
          ))}
        </div>
        <div class="menu-col">
          <p class="menu-h">Formats</p>
          <a href="/briefs">In Brief</a>
          <a href="/newsletter">{site.newsletter}</a>
          <a href="/feed.xml">RSS</a>
          <p class="menu-h">Readers</p>
          <a href="/tips">Send a Tip</a>
          <a href="/search">Search</a>
        </div>
        <div class="menu-col">
          <p class="menu-h">{site.name}</p>
          <a href="/about">About Us</a>
          <a href="/masthead">Masthead</a>
          <a href="/ethics">Ethics Policy</a>
          <a href="/corrections">Corrections</a>
          <a href="/contact">Contact</a>
        </div>
        <div class="menu-theme" hidden>
          <p class="menu-h">Appearance</p>
          <ThemeOptions />
        </div>
      </div>
    </details>
  )
}

/** The Bloatberg Terminal: a market strip of numbers the industry cares about. */
function Ticker() {
  const qs = quotes(nowSeconds())
  return (
    <div class="ticker" aria-label={`${site.name} Terminal`}>
      <div class="wrap ticker-inner">
        <span class="ticker-label">{site.name} Terminal</span>
        <ul class="ticker-list">
          {qs.map((q) => (
            <li>
              <span class="ticker-name">{q.name}</span>
              <span class="ticker-value">{q.value}</span>
              <span class={`ticker-chg q-${q.dir}`}>
                {q.dir === 'up' ? '▲ ' : q.dir === 'down' ? '▼ ' : q.dir === 'alert' ? <span class="q-pulse" aria-hidden="true"></span> : ''}
                {q.change}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function LiveAlert({ story }: { story: PublishedStory }) {
  return (
    <div class="alert">
      <a class="wrap alert-inner" href={articlePath(story)}>
        <span class="alert-tag"><span class="live-dot" aria-hidden="true"></span>Live</span>
        <span class="alert-text">
          <strong>{story.title.replace(/^Live updates:\s*/i, '')}</strong>
          {story.live_latest && <span class="alert-latest"> Latest: {story.live_latest}</span>}
        </span>
        <time class="alert-time" datetime={isoDate(story.updated_at)}>{relativeTime(story.updated_at)}</time>
      </a>
    </div>
  )
}

function Footer() {
  const year = new Date().getUTCFullYear()
  return (
    <footer class="footer">
      <div class="wrap">
        <div class="footer-brand">
          <a class="nameplate nameplate-footer" href="/">{site.name}</a>
          <p class="footer-tagline">{site.tagline}</p>
        </div>
        <div class="footer-cols">
          <nav class="footer-col" aria-label="News">
            <p class="footer-h">News</p>
            {site.sections.map((s) => (
              <a href={`/section/${s.slug}`}>{s.long}</a>
            ))}
          </nav>
          <nav class="footer-col" aria-label="Formats">
            <p class="footer-h">Formats</p>
            <a href="/briefs">In Brief</a>
            <a href="/newsletter">{site.newsletter}</a>
            <a href="/search">Search</a>
            <a href="/feed.xml">RSS</a>
          </nav>
          <nav class="footer-col" aria-label="Company">
            <p class="footer-h">Company</p>
            <a href="/about">About Us</a>
            <a href="/masthead">Masthead</a>
            <a href="/ethics">Ethics Policy</a>
            <a href="/corrections">Corrections</a>
            <a href="/contact">Contact</a>
          </nav>
          <div class="footer-col footer-promo">
            <p class="footer-h">Newsletter</p>
            <p class="footer-promo-name">{site.newsletter}</p>
            <p class="footer-promo-copy">The week’s five most-read stories. Every Friday.</p>
            <a class="btn btn-invert" href="/newsletter">Sign up</a>
            <p class="footer-h footer-h-tip">Have a tip?</p>
            <p class="footer-promo-copy">
              <a href="/tips">Send it to our newsroom</a>. Anonymous, and you get no credit at all.
            </p>
          </div>
        </div>
        <div class="footer-bottom">
          <p class="footer-legal">
            © {year} {site.name}. All rights reserved, none of them earned. Everything on this site is satire and every
            story is made up. If you needed this sentence to work that out, please hand your phone to a responsible
            adult. <a href="/about">More on that</a>.
          </p>
          <nav class="footer-fine" aria-label="Legal">
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms of Service</a>
            <a href="/corrections">Corrections</a>
          </nav>
        </div>
      </div>
    </footer>
  )
}
