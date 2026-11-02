import { raw } from 'hono/html'
import { sectionInfo, sectionName, site } from '../../config'
import { articlePath, imageUrl, isLiveEnded, isLiveNow, type PublishedStory, type Story } from '../../db/articles'
import { dateTimeET, isoDate, relativeTime, shortDate } from '../../lib/dates'
import { parseLive } from '../../lib/live'
import { ArrowIcon } from './icons'

type Pub = PublishedStory

// ---------- Small pieces ----------

/** Section kicker, preceded by the live badge, "In Brief" or a story label such as "Exclusive". */
export function Kicker({ section, story, showSection = true }: {
  section: string
  story?: Pick<Story, 'format' | 'updated_at' | 'label' | 'live_ended_at'>
  showSection?: boolean
}) {
  const live = story?.format === 'live'
  // "Review" over a story in Reviews would just repeat the section.
  const label = story?.label === 'Review' && section === 'reviews' && showSection ? '' : story?.label
  return (
    <span class="kicker-row">
      {live && <LiveBadge active={isLiveNow(story!)} ended={isLiveEnded(story!)} />}
      {story?.format === 'brief' && <a class="kicker kicker-brief" href="/briefs">In Brief</a>}
      {label && <span class={`story-label story-label-${label.toLowerCase()}`}>{label}</span>}
      {showSection && (
        <a class="kicker" href={`/section/${section}`}>
          {sectionName(section)}
        </a>
      )}
    </span>
  )
}

/**
 * Pulsing red "Live" while updated in the last 24 hours, a quiet "Live updates" label after,
 * and "Coverage ended" once an editor ends it.
 */
export function LiveBadge({ active, ended = false }: { active: boolean; ended?: boolean }) {
  if (ended) return <span class="live-badge live-badge-ended live-badge-archived">Coverage ended</span>
  return active ? (
    <span class="live-badge"><span class="live-dot" aria-hidden="true"></span>Live</span>
  ) : (
    <span class="live-badge live-badge-ended">Live updates</span>
  )
}

/** "Latest: <newest update headline>" under live stories on fronts. */
export function LiveLatest({ story }: { story: Pub }) {
  if (story.format !== 'live' || !story.live_latest) return null
  return (
    <p class="live-latest">
      <span>{isLiveEnded(story) ? 'Final update:' : 'Latest:'}</span> {story.live_latest}
    </p>
  )
}

export function Img({ story, sizes, eager, cls }: { story: Story; sizes?: string; eager?: boolean; cls?: string }) {
  if (!story.image_key) return <div class={`img-ph ${cls ?? ''}`} aria-hidden="true" />
  return (
    <img
      class={cls}
      src={imageUrl(story.image_key)}
      alt={story.image_alt}
      width="1600"
      height="900"
      sizes={sizes}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      fetchpriority={eager ? 'high' : undefined}
    />
  )
}

/** Byline line on fronts: "By Name · 2h ago · 6 min read". */
export function BylineShort({ story, relative = true, readTime }: { story: Pub; relative?: boolean; readTime?: boolean }) {
  const live = story.format === 'live'
  const ended = isLiveEnded(story)
  const ts = ended ? story.live_ended_at! : live ? story.updated_at : story.published_at
  return (
    <p class="byline-short">
      <span class="byline-short-name">By {story.author_name}</span>
      <time datetime={isoDate(ts)} class={live && isLiveNow(story) ? 'live-updated' : undefined}>
        {ended ? 'Ended ' : live && 'Updated '}
        {relative || live ? relativeTime(ts) : shortDate(ts)}
      </time>
      {live && story.live_count > 0 && <span>{story.live_count} {story.live_count === 1 ? 'update' : 'updates'}</span>}
      {readTime && !live && story.format !== 'brief' && <span>{story.read_minutes} min read</span>}
    </p>
  )
}

/** Monogram avatar for bylines. The tint is stable per name. */
export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const tints = ['#e9e1d3', '#dfe5e8', '#e6dfe8', '#e2e8dc', '#ebe0dc', '#e0e3ee']
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return (
    <span class={`avatar avatar-${size}`} style={`--tint:${tints[h % tints.length]}`} aria-hidden="true">
      {initials(name)}
    </span>
  )
}

/** Article-page byline: avatar, name and title, then the timestamps. */
export function Byline({ story }: { story: Pub }) {
  const updated = story.updated_at - story.published_at > 600
  return (
    <div class="byline">
      <a class="byline-person" href={`/author/${story.author_slug}`} rel="author">
        <Avatar name={story.author_name} />
        <span>
          <span class="byline-name">By {story.author_name}</span>
          {story.author_title && <span class="byline-title">{story.author_title}</span>}
        </span>
      </a>
      <p class="byline-meta">
        <time datetime={isoDate(story.published_at)}>{dateTimeET(story.published_at)}</time>
        {updated && (
          <span>
            Updated <time datetime={isoDate(story.updated_at)}>{dateTimeET(story.updated_at)}</time>
          </span>
        )}
        {story.format !== 'brief' && <span>{story.read_minutes} min read</span>}
      </p>
    </div>
  )
}

/** Review score chip, laid over the picture on fronts. */
export function ScoreBadge({ score }: { score: number | null }) {
  if (score === null || score === undefined) return null
  const text = Number.isInteger(score) ? String(score) : score.toFixed(1)
  return (
    <span class={`score-badge${score >= 8 ? ' score-high' : score < 5 ? ' score-low' : ''}`} aria-label={`Score: ${text} out of 10`}>
      {text}
      <small>/10</small>
    </span>
  )
}

// ---------- Story units ----------

type Size = 'xl' | 'lg' | 'md' | 'sm' | 'xs'

/**
 * One story on a front. `media`: 'top' (picture above), 'side' (thumbnail at the right), 'none'.
 * `dek` shows the subheadline; `kicker` the section/label row.
 */
export function StoryUnit({ story, size = 'md', media = 'top', dek = false, kicker = true, readTime = false, eager, sizes }: {
  story: Pub
  size?: Size
  media?: 'top' | 'side' | 'none'
  dek?: boolean
  kicker?: boolean
  readTime?: boolean
  eager?: boolean
  sizes?: string
}) {
  const href = articlePath(story)
  const hasMedia = media !== 'none' && story.format !== 'brief'
  return (
    <article class={`unit unit-${size} unit-media-${hasMedia ? media : 'none'}`}>
      {hasMedia && (
        <a class="unit-media" href={href} tabindex={-1} aria-hidden="true">
          <Img story={story} eager={eager} sizes={sizes ?? (media === 'side' ? '200px' : '(min-width: 1100px) 400px, 100vw')} />
          {media === 'top' && <ScoreBadge score={story.review_score} />}
        </a>
      )}
      <div class="unit-text">
        {kicker && <Kicker section={story.section} story={story} />}
        <h3 class="unit-title">
          <a href={href}>{story.title}</a>
        </h3>
        <LiveLatest story={story} />
        {dek && story.dek && story.format !== 'live' && <p class="unit-dek">{story.dek}</p>}
        <BylineShort story={story} readTime={readTime} />
      </div>
    </article>
  )
}

/** The lead package: big headline and dek beside the picture, with related links or the latest live updates. */
export function LeadPackage({ story }: { story: Pub }) {
  const href = articlePath(story)
  const live = story.format === 'live'
  const updates = live ? parseLive(story.body_md).updates.slice(0, 3) : []
  const count = story.live_count
  return (
    <article class={`lead${live ? ' lead-live' : ''}`}>
      <div class="lead-text">
        <Kicker section={story.section} story={story} />
        <h2 class="lead-title">
          <a href={href}>{story.title}</a>
        </h2>
        {story.dek && <p class="lead-dek">{story.dek}</p>}
        <BylineShort story={story} readTime />
      </div>
      <a class="lead-media" href={href} tabindex={-1} aria-hidden="true">
        <Img story={story} eager sizes="(min-width: 1100px) 620px, 100vw" />
        <ScoreBadge score={story.review_score} />
        {story.image_credit && <span class="lead-credit">{story.image_credit}</span>}
      </a>
      {live && updates.length > 0 && (
        <div class="lead-extra">
          <ol class="lead-updates">
            {updates.map((u, i) => (
              <li>
                <time>{u.time}</time>
                <a href={`${href}#update-${count - i}`}>{u.headline}</a>
              </li>
            ))}
          </ol>
          <a class="lead-more" href={href}>
            See all {count} updates <ArrowIcon />
          </a>
        </div>
      )}
    </article>
  )
}

/** Horizontal river item: text left, thumbnail right. Used on section/author fronts. */
export function RiverItem({ story, showKicker = true }: { story: Pub; showKicker?: boolean }) {
  const href = articlePath(story)
  const brief = story.format === 'brief'
  return (
    <article class={brief ? 'river-item river-brief' : 'river-item'}>
      <time class="river-date" datetime={isoDate(story.published_at)}>{relativeTime(story.published_at)}</time>
      <div class="river-text">
        <Kicker section={story.section} story={story} showSection={showKicker} />
        <h3 class="river-title">
          <a href={href}>{story.title}</a>
        </h3>
        <LiveLatest story={story} />
        {story.dek && story.format !== 'live' && <p class="river-dek">{story.dek}</p>}
        <BylineShort story={story} readTime />
      </div>
      {!brief && (
        <a class="river-media" href={href} tabindex={-1} aria-hidden="true">
          <Img story={story} sizes="(min-width: 760px) 260px, 112px" />
          <ScoreBadge score={story.review_score} />
        </a>
      )}
    </article>
  )
}

export function SectionHead({ title, href, more }: { title: string; href?: string; more?: string }) {
  return (
    <h2 class="sh">
      {href ? <a class="sh-title" href={href}>{title}<ArrowIcon /></a> : <span class="sh-title">{title}</span>}
      {more && href && <a class="sh-more" href={href}>{more}</a>}
    </h2>
  )
}

export function LatestList({ stories, title = 'Latest' }: { stories: Pub[]; title?: string }) {
  return (
    <section class="latest" aria-label={title}>
      <SectionHead title={title} />
      <ol class="latest-list">
        {stories.map((s) => (
          <li>
            <time class="latest-time" datetime={isoDate(s.published_at)}>
              {relativeTime(s.published_at)}
            </time>
            <div>
              <Kicker section={s.section} story={s} />
              <a class="latest-title" href={articlePath(s)}>{s.title}</a>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

export function BriefsBand({ stories }: { stories: Pub[] }) {
  return (
    <section class="briefs" aria-label="In Brief">
      <SectionHead title="In Brief" href="/briefs" more="All briefs" />
      <ul class="briefs-list">
        {stories.map((s) => (
          <li>
            <p class="briefs-meta">
              <a class="kicker" href={`/section/${s.section}`}>{sectionName(s.section)}</a>
              <time datetime={isoDate(s.published_at)}>{relativeTime(s.published_at)}</time>
            </p>
            <a class="briefs-title" href={articlePath(s)}>{s.title}</a>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function NumbersBand({ items }: { items: { figure: string; text: string }[] }) {
  return (
    <section class="numbers" aria-label="By the numbers">
      <SectionHead title="By the Numbers" />
      <ul class="numbers-list">
        {items.map((n) => (
          <li>
            <span class="numbers-figure">{n.figure}</span>
            <span class="numbers-text">{n.text}</span>
          </li>
        ))}
      </ul>
      <p class="numbers-source">Source: {site.name} analysis. Figures are not real, which is more than can be said for most.</p>
    </section>
  )
}

/** A section package on the home page: one story with a picture and a short list. */
export function SectionBlock({ section, stories }: { section: string; stories: Pub[] }) {
  const [first, ...rest] = stories
  if (!first) return null
  const info = sectionInfo(section)
  return (
    <section class="sblock" aria-label={info?.long ?? section}>
      <SectionHead title={info?.long ?? sectionName(section)} href={`/section/${section}`} />
      <StoryUnit story={first} size="sm" media="top" kicker={false} />
      {rest.length > 0 && (
        <ul class="sblock-list">
          {rest.map((s) => (
            <li>
              <a href={articlePath(s)}>{s.title}</a>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function MostRead({ stories }: { stories: Pub[] }) {
  return (
    <section class="most-read" aria-label="Most read">
      <SectionHead title="Most Read" />
      <ol>
        {stories.map((s) => (
          <li>
            <a href={articlePath(s)}>{s.title}</a>
          </li>
        ))}
      </ol>
    </section>
  )
}

export function HouseAd({ newsletter }: { newsletter: string }) {
  return (
    <aside class="house-ad" aria-label="Newsletter">
      <p class="house-ad-eyebrow">The newsletter</p>
      <p class="house-ad-name">{newsletter}</p>
      <p class="house-ad-copy">The week’s five most-read stories. Every Friday.</p>
      <NewsletterForm id="nl-rail" compact />
    </aside>
  )
}

export function TipPromo() {
  return (
    <aside class="tip-promo" aria-label="Send a tip">
      <p class="house-ad-eyebrow">Tips</p>
      <p class="tip-promo-title">Seen something absurd in tech?</p>
      <p class="house-ad-copy">Our newsroom reads every tip. Anonymous by default. Credit by never.</p>
      <a class="btn btn-outline" href="/tips">Send a tip</a>
    </aside>
  )
}

export function AuthorBox({ story }: { story: Pub }) {
  return (
    <aside class="author-box">
      <a href={`/author/${story.author_slug}`} tabindex={-1}>
        <Avatar name={story.author_name} size="lg" />
      </a>
      <div>
        <p class="author-box-name">
          <a href={`/author/${story.author_slug}`}>{story.author_name}</a>
          {story.author_title && <span class="author-box-title">{story.author_title}</span>}
        </p>
        {story.author_bio && <p class="author-box-bio">{story.author_bio}</p>}
        <p class="author-box-more">
          <a href={`/author/${story.author_slug}`}>More from {story.author_name.split(' ')[0]}</a>
        </p>
      </div>
    </aside>
  )
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('')
}

export const Html = ({ html }: { html: string }) => <>{raw(html)}</>

export type NewsletterState = 'subscribed' | 'invalid' | 'slow-down' | undefined

/** The sign-up form. Also used in the newsletter box on the front page. */
export function NewsletterForm({ state, email = '', id, compact }: { state?: NewsletterState; email?: string; id?: string; compact?: boolean }) {
  return (
    <form class={`nl-form${compact ? ' nl-form-compact' : ''}`} method="post" action="/newsletter" id={id}>
      {state === 'invalid' && <p class="nl-msg" role="alert">That doesn’t look like an email address.</p>}
      {state === 'slow-down' && <p class="nl-msg" role="alert">Too many sign-ups from your connection. Try again in an hour.</p>}
      <div class="nl-row">
        <label class="visually-hidden" for={`${id ?? 'nl'}-email`}>Email address</label>
        <input id={`${id ?? 'nl'}-email`} type="email" name="email" value={email} required maxlength={254}
          placeholder="you@example.com" autocomplete="email" />
        <button class="btn" type="submit">Sign up</button>
      </div>
      <div class="tips-hp" aria-hidden="true">
        <label>Leave this empty <input type="text" name="website" tabindex={-1} autocomplete="off" /></label>
      </div>
      <p class="nl-fine">
        Free. One email a week. Unsubscribe any time. <a href="/terms#newsletter">Terms</a> ·{' '}
        <a href="/privacy#newsletter">Privacy</a>
      </p>
    </form>
  )
}
