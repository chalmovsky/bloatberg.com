import { site } from '../../config'
import type { PublishedStory } from '../../db/articles'
import { Layout } from '../Layout'
import {
  BriefsBand, HouseAd, LatestList, LeadPackage, MostRead, NumbersBand, SectionBlock, StoryUnit, TipPromo,
} from '../components'

export interface FrontData {
  lead: PublishedStory | null
  secondary: PublishedStory[] // two, with pictures
  tertiary: PublishedStory[] // three, with thumbnails
  briefs: PublishedStory[]
  numbers: { figure: string; text: string }[]
  blocks: { section: string; stories: PublishedStory[] }[]
  latest: PublishedStory[]
  mostRead: PublishedStory[]
  alert: PublishedStory | null
}

export function Home({ siteUrl, data: d }: { siteUrl: string; data: FrontData }) {
  return (
    <Layout siteUrl={siteUrl} meta={{ path: '/' }} variant="front" alert={d.alert}>
      <h1 class="visually-hidden">{site.name}: {site.tagline}</h1>
      <div class="wrap front">
        <div class="front-top">
          <div class="front-main">
            {d.lead ? <LeadPackage story={d.lead} /> : <p class="empty">No stories have been published yet.</p>}
            {(d.secondary.length > 0 || d.tertiary.length > 0) && (
              <div class="front-row">
                {d.secondary.map((s) => (
                  <div class="front-cell">
                    <StoryUnit story={s} size="md" media="top" dek sizes="(min-width: 1100px) 300px, (min-width: 760px) 50vw, 100vw" />
                  </div>
                ))}
                {d.tertiary.length > 0 && (
                  <div class="front-cell front-stack">
                    {d.tertiary.map((s) => (
                      <StoryUnit story={s} size="xs" media="side" />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <aside class="rail">
            {d.mostRead.length > 0 && <MostRead stories={d.mostRead} />}
            <HouseAd newsletter={site.newsletter} />
          </aside>
        </div>

        {d.briefs.length > 0 && <BriefsBand stories={d.briefs} />}

        {d.blocks.length > 0 && (
          <div class="sblocks">
            {d.blocks.map((b) => (
              <SectionBlock section={b.section} stories={b.stories} />
            ))}
          </div>
        )}

        <NumbersBand items={d.numbers} />

        {d.latest.length > 0 && (
          <div class="front-bottom">
            <LatestList stories={d.latest} title="The Latest" />
            <aside class="rail rail-bottom">
              <TipPromo />
            </aside>
          </div>
        )}
      </div>
    </Layout>
  )
}
