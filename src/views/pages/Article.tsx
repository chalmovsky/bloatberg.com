import { sectionInfo, sectionName, site } from '../../config'
import { articlePath, imageUrl, isLiveEnded, isLiveNow, shareImage, type PublishedStory } from '../../db/articles'
import { dateTimeET, isoDate, relativeTime, shortDate } from '../../lib/dates'
import { insertAfterParagraphs, withDateline } from '../../lib/inject'
import { excerpt } from '../../lib/markdown'
import { Layout } from '../Layout'
import { AuthorBox, Avatar, Byline, Html, Img, Kicker, MostRead, SectionHead, StoryUnit } from '../components'
import { CameraIcon, GiftIcon, InIcon, LinkIcon, MailIcon, ShareIcon, XIcon } from '../components/icons'

interface Props {
  siteUrl: string
  story: PublishedStory
  related: PublishedStory[]
  briefs?: PublishedStory[]
  mostRead?: PublishedStory[]
  alert?: PublishedStory | null
  preview?: boolean
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function ArticlePage({ siteUrl, story, related, briefs = [], mostRead = [], alert, preview }: Props) {
  const path = articlePath(story)
  const url = new URL(path, siteUrl).toString()
  const live = story.format === 'live'
  const brief = story.format === 'brief'
  const description =
    (live && story.live_latest ? `Latest: ${story.live_latest}` : '') || story.dek || excerpt(story.body_md) || story.title
  const image = shareImage(story)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': live ? 'LiveBlogPosting' : 'NewsArticle',
    headline: story.title,
    description,
    image: [new URL(image, siteUrl).toString()],
    datePublished: isoDate(story.published_at),
    dateModified: isoDate(story.updated_at),
    articleSection: sectionName(story.section),
    author: [{ '@type': 'Person', name: story.author_name, jobTitle: story.author_title || undefined, url: new URL(`/author/${story.author_slug}`, siteUrl).toString() }],
    publisher: { '@type': 'Organization', name: site.name, logo: { '@type': 'ImageObject', url: new URL('/icon-512.png', siteUrl).toString() } },
    mainEntityOfPage: url,
    ...(live ? { coverageStartTime: isoDate(story.published_at) } : {}),
    ...(isLiveEnded(story) ? { coverageEndTime: isoDate(story.live_ended_at!) } : {}),
  }

  // Inline furniture: a related story after the fourth paragraph and a newsletter box further down.
  const [inline, ...moreRelated] = related
  let body = story.body_html
  if (!live && !brief) {
    body = withDateline(body, story.dateline)
    const modules = []
    if (inline) modules.push({ after: 4, html: inlineRelated(inline) })
    modules.push({ after: 9, html: inlineNewsletter() })
    body = insertAfterParagraphs(body, modules)
  }
  const bottom = live || brief ? related : moreRelated
  const info = sectionInfo(story.section)

  return (
    <Layout
      siteUrl={siteUrl}
      activeSection={story.section}
      alert={alert}
      meta={{
        title: story.title,
        description,
        path,
        image,
        imageAlt: story.share_key ? story.title : story.image_key ? story.image_alt : story.title,
        imageSize: story.share_key ? [1200, 630] : undefined,
        type: 'article',
        noindex: preview,
        shareScript: true,
        article: {
          publishedTime: isoDate(story.published_at),
          modifiedTime: isoDate(story.updated_at),
          section: sectionName(story.section),
          author: story.author_name,
        },
      }}
    >
      {preview && <div class="preview-banner">Draft preview — not visible to readers.</div>}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <article class={`article article-${story.format}${story.dateline ? ' has-dateline' : ''}`}>
        <header class="wrap article-head">
          <Kicker section={story.section} story={story} />
          <h1 class="article-title">{story.title}</h1>
          {story.dek && <p class="article-dek">{story.dek}</p>}
        </header>

        {!brief && (
          <figure class="wrap-wide hero">
            <Img story={story} eager sizes="(min-width: 1100px) 1100px, 100vw" />
            {(story.image_alt || story.image_credit) && (
              <figcaption>
                {story.image_alt && <span class="caption">{story.image_alt}</span>}
                {story.image_credit && <span class="credit">{story.image_credit}</span>}
              </figcaption>
            )}
          </figure>
        )}

        <div class="wrap article-meta">
          {live ? <LiveByline story={story} /> : <Byline story={story} />}
          <ShareBar url={url} title={story.title} dek={story.dek} card={{
            kicker: cardKicker(story),
            byline: `By ${story.author_name}`,
            date: shortDate(story.published_at),
            image: !brief && story.image_key ? imageUrl(story.image_key) : '',
          }} />
        </div>

        <div class="wrap article-body-wrap">
          {isLiveEnded(story) && (
            <p class="live-ended-note">
              <strong>This live coverage has ended.</strong> Every update is below, newest first.
            </p>
          )}
          <div class={`prose ${live ? 'live-body' : 'article-body'}`}>
            <Html html={body} />
          </div>
        </div>

        <footer class="wrap article-end">
          <aside class="shot-promo" aria-label="Share as a picture" hidden>
            <button type="button" class="shot-promo-thumb" data-screenshot aria-label="Open the screenshot">
              <img alt="" hidden />
            </button>
            <div class="shot-promo-text">
              <p class="shot-promo-h">Share it as a picture</p>
              <p class="shot-promo-copy">A clean screenshot of this story, ready to post.</p>
              <button type="button" class="btn" data-screenshot>
                <CameraIcon /> Get the screenshot
              </button>
            </div>
          </aside>
          {!brief && !live && (
            <p class="article-version">
              A version of this article appeared in <a href="/newsletter"><em>{site.newsletter}</em></a>, {site.name}’s
              weekly newsletter.
            </p>
          )}
          <p class="article-topics">
            <span>Topics</span>
            <a href={`/section/${story.section}`}>{info?.long ?? sectionName(story.section)}</a>
            {live && <a href="/">Live coverage</a>}
            {brief && <a href="/briefs">In Brief</a>}
          </p>
          <AuthorBox story={story} />
          <p class="article-standards">
            {site.name} adheres to the highest standards of satire. Found an error? Read our{' '}
            <a href="/corrections">corrections policy</a>. Seen something just as absurd?{' '}
            <a href="/tips">Send us a tip</a> — anonymous, uncredited, no strings.
          </p>
        </footer>
      </article>

      {brief && briefs.length > 0 && (
        <section class="wrap more-briefs" aria-label="More in brief">
          <SectionHead title="More in Brief" href="/briefs" more="All briefs" />
          <ul>
            {briefs.map((b) => (
              <li>
                <a href={articlePath(b)}>{b.title}</a>
                <time datetime={isoDate(b.published_at)}>{relativeTime(b.published_at)}</time>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(bottom.length > 0 || mostRead.length > 0) && (
        <section class="wrap article-more" aria-label="More stories">
          <div class="article-more-main">
            <SectionHead
              title={brief ? 'Top Stories' : `More in ${info?.long ?? sectionName(story.section)}`}
              href={brief ? '/' : `/section/${story.section}`}
            />
            <div class="article-more-grid">
              {bottom.map((s) => (
                <StoryUnit story={s} size="sm" media="top" sizes="(min-width: 760px) 280px, 100vw" />
              ))}
            </div>
          </div>
          {mostRead.length > 0 && (
            <aside class="article-more-rail">
              <MostRead stories={mostRead} />
            </aside>
          )}
        </section>
      )}
    </Layout>
  )
}

/**
 * Share menu. Without JavaScript every option is a plain link. With /js/share.js, "Copy link" copies and
 * says so, and on phones "Share" opens the system share sheet. Prefilled text is the headline + site name.
 */
/** "LIVE · AI", "EXCLUSIVE · STARTUPS": the red line above the headline on image cards. */
function cardKicker(s: PublishedStory) {
  const section = sectionName(s.section)
  const label = s.label && `${s.label}s` !== section ? s.label : ''
  return [s.format === 'live' ? 'Live' : s.format === 'brief' ? 'In Brief' : '', label, section].filter(Boolean).join(' · ')
}

interface CardData { kicker: string; byline: string; date: string; image: string }

function ShareBar({ url, title, dek, card }: { url: string; title: string; dek: string; card: CardData }) {
  const enc = encodeURIComponent
  const text = `${title} | ${site.name}`
  const mailBody = `${title}\n\n${dek ? `${dek}\n\n` : ''}${url}\n\nShared from ${site.name}.`
  const targets: [string, string, typeof XIcon][] = [
    ['X', `https://x.com/intent/post?text=${enc(text)}&url=${enc(url)}`, XIcon],
    ['Bluesky', `https://bsky.app/intent/compose?text=${enc(`${text} ${url}`)}`, ShareIcon],
    ['Threads', `https://www.threads.net/intent/post?text=${enc(`${text} ${url}`)}`, ShareIcon],
    ['LinkedIn', `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`, InIcon],
    ['Facebook', `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`, ShareIcon],
    ['Reddit', `https://www.reddit.com/submit?url=${enc(url)}&title=${enc(title)}`, ShareIcon],
    ['Hacker News', `https://news.ycombinator.com/submitlink?u=${enc(url)}&t=${enc(title)}`, ShareIcon],
    ['WhatsApp', `https://wa.me/?text=${enc(`${text} ${url}`)}`, ShareIcon],
    ['Telegram', `https://t.me/share/url?url=${enc(url)}&text=${enc(text)}`, ShareIcon],
  ]
  return (
    <div class="sharebar" data-share-url={url} data-share-title={text} data-title={title} data-dek={dek}
      data-kicker={card.kicker} data-byline={card.byline} data-date={card.date} data-image={card.image}>
      <button type="button" class="share-btn share-shot" data-screenshot hidden>
        <CameraIcon />
        <img class="share-shot-mini" alt="" width="19" height="23" hidden />
        <span>Screenshot</span>
      </button>
      <details class="share-menu">
        <summary class="share-btn share-btn-primary" data-native-share>
          <GiftIcon />
          <span>Share full article</span>
        </summary>
        <div class="share-panel">
          <p class="share-panel-h">Share this article</p>
          <p class="share-panel-copy">Anyone can read it. They could always read it. There is no paywall. It just felt right to have this button.</p>
          <button type="button" class="share-copy share-copy-wide" data-copy={url} hidden>
            <LinkIcon /> <span data-copy-label>Copy link</span>
          </button>
          <a class="share-row" href={`mailto:?subject=${enc(title)}&body=${enc(mailBody)}`}><MailIcon /> Email</a>
          <div class="share-grid">
            {targets.map(([name, href, Icon]) => (
              <a href={href} rel="noopener" target="_blank"><Icon /> {name}</a>
            ))}
          </div>
        </div>
      </details>
      <a class="share-btn share-icon" href={`mailto:?subject=${enc(title)}&body=${enc(mailBody)}`} aria-label="Share by email" title="Email"><MailIcon /></a>
      <a class="share-btn share-icon" href={targets[0]![1]} rel="noopener" target="_blank" aria-label="Share on X" title="X"><XIcon /></a>
      <button type="button" class="share-btn share-icon share-copy" data-copy={url} aria-label="Copy link" title="Copy link" hidden>
        <LinkIcon />
      </button>
      <span class="share-toast" role="status" aria-live="polite"></span>
    </div>
  )
}

function inlineRelated(s: PublishedStory) {
  const href = articlePath(s)
  const img = s.image_key
    ? `<img src="${esc(imageUrl(s.image_key))}" alt="" width="160" height="90" loading="lazy" decoding="async">`
    : ''
  return `<aside class="inline-related" aria-label="Related story"><a href="${esc(href)}">${img}<span><span class="inline-related-k">Related</span><span class="inline-related-t">${esc(s.title)}</span></span></a></aside>`
}

function inlineNewsletter() {
  return `<aside class="inline-nl" aria-label="Newsletter"><p class="inline-nl-name">${esc(site.newsletter)}</p><p class="inline-nl-copy">The week’s five most-read stories on ${esc(site.name)}. Every Friday.</p><form class="nl-form nl-form-compact" method="post" action="/newsletter"><div class="nl-row"><label class="visually-hidden" for="nl-inline-email">Email address</label><input id="nl-inline-email" type="email" name="email" required maxlength="254" placeholder="you@example.com" autocomplete="email"><button class="btn" type="submit">Sign up</button></div><div class="tips-hp" aria-hidden="true"><label>Leave this empty <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div><p class="nl-fine">Free. Unsubscribe any time. <a href="/terms#newsletter">Terms</a> · <a href="/privacy#newsletter">Privacy</a></p></form></aside>`
}

/** Live coverage byline: started time, last update, number of updates. */
function LiveByline({ story }: { story: PublishedStory }) {
  const active = isLiveNow(story)
  const ended = isLiveEnded(story)
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
        {ended ? (
          <span>Ended <time datetime={isoDate(story.live_ended_at!)}>{dateTimeET(story.live_ended_at!)}</time></span>
        ) : (
          <span class={active ? 'live-updated' : undefined}>
            Updated <time datetime={isoDate(story.updated_at)}>{relativeTime(story.updated_at)}</time>
          </span>
        )}
        <span>Started <time datetime={isoDate(story.published_at)}>{dateTimeET(story.published_at)}</time></span>
        {story.live_count > 0 && <span>{story.live_count} {story.live_count === 1 ? 'update' : 'updates'}</span>}
      </p>
    </div>
  )
}
