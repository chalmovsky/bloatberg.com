import type { Child } from 'hono/jsx'
import { site } from '../../config'
import type { PublishedStory } from '../../db/articles'
import { Layout, type Meta } from '../Layout'
import { HouseAd, LeadPackage, RiverItem, StoryUnit, TipPromo } from '../components'

interface StreamProps {
  siteUrl: string
  meta: Meta
  activeSection?: string
  heading: Child
  stories: PublishedStory[]
  showKicker?: boolean
  empty?: string
  alert?: PublishedStory | null
}

/** Shared list page for authors, briefs and search: a heading block, a river of stories and a rail. */
export function StreamPage({ siteUrl, meta, activeSection, heading, stories, showKicker = true, empty, alert }: StreamProps) {
  return (
    <Layout siteUrl={siteUrl} meta={meta} activeSection={activeSection} alert={alert}>
      <div class="wrap stream">
        <header class="stream-head">{heading}</header>
        <div class="stream-body">
          <div class="river">
            {stories.length === 0 ? (
              <p class="empty">{empty ?? 'Nothing here yet.'}</p>
            ) : (
              stories.map((s) => <RiverItem story={s} showKicker={showKicker} />)
            )}
          </div>
          <aside class="rail">
            <HouseAd newsletter={site.newsletter} />
            <TipPromo />
          </aside>
        </div>
      </div>
    </Layout>
  )
}

interface SectionProps {
  siteUrl: string
  meta: Meta
  section: string
  title: string
  blurb: string
  stories: PublishedStory[]
  alert?: PublishedStory | null
  /** Optional module above the lead. */
  top?: Child
}

/** Section front: lead package, two secondary stories, then the river. */
export function SectionFront({ siteUrl, meta, section, title, blurb, stories, alert, top }: SectionProps) {
  const withPictures = stories.filter((s) => s.format !== 'brief' && s.image_key)
  const lead = withPictures[0]
  const secondary = withPictures.slice(1, 3)
  const shown = new Set([lead, ...secondary].filter(Boolean).map((s) => s!.id))
  const rest = stories.filter((s) => !shown.has(s.id))
  return (
    <Layout siteUrl={siteUrl} meta={meta} activeSection={section} alert={alert}>
      <div class="wrap stream section-front">
        <header class="stream-head section-head">
          <h1 class="stream-title">{title}</h1>
          <p class="stream-sub">{blurb}</p>
        </header>
        {top}
        {stories.length === 0 && <p class="empty">No {title} stories yet.</p>}
        {lead && (
          <div class="section-top">
            <LeadPackage story={lead} />
            {secondary.length > 0 && (
              <div class="section-secondary">
                {secondary.map((s) => (
                  <StoryUnit story={s} size="md" media="top" dek kicker={false} sizes="(min-width: 760px) 50vw, 100vw" />
                ))}
              </div>
            )}
          </div>
        )}
        {rest.length > 0 && (
          <div class="stream-body">
            <div class="river">
              <h2 class="river-h">Latest in {title}</h2>
              {rest.map((s) => (
                <RiverItem story={s} showKicker={false} />
              ))}
            </div>
            <aside class="rail">
              <HouseAd newsletter={site.newsletter} />
              <TipPromo />
            </aside>
          </div>
        )}
      </div>
    </Layout>
  )
}
