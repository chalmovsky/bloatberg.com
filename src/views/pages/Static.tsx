import type { Child } from 'hono/jsx'
import { MASTHEAD, site } from '../../config'
import type { Author } from '../../db/authors'
import { articlePath, type PublishedStory } from '../../db/articles'
import { sectionName } from '../../config'
import { Layout } from '../Layout'
import { NewsletterForm, type NewsletterState } from '../components'

function StaticPage({ siteUrl, path, title, description, children }: {
  siteUrl: string; path: string; title: string; description: string; children: Child
}) {
  return (
    <Layout siteUrl={siteUrl} meta={{ title, description, path }}>
      <article class="wrap static">
        <h1 class="static-title">{title}</h1>
        <div class="prose">{children}</div>
      </article>
    </Layout>
  )
}

export const staticPages: Record<string, { title: string; description: string; body: () => Child }> = {
  about: {
    title: `About ${site.name}`,
    description: `${site.name} is an independent publication covering technology and the people who build it.`,
    body: () => (
      <>
        <p class="lede">
          {site.name} is an independent publication covering the companies, products and people shaping technology.
          We publish news, analysis and features across artificial intelligence, startups, software development,
          hardware, policy and culture.
        </p>
        <h2>Is any of this real?</h2>
        <p>
          No. {site.name} is satire. DUH! Every story is made up, every quote is invented.
        </p>
        <p>
          If you’re reading this paragraph because you genuinely weren’t sure - that’s okay. Take a breath. Drink some
          water.
        </p>
        <p>
          When a real person or company shows up in a story, it’s parody, not reporting. Nothing here is a statement of
          fact about anyone, and if you cite it as one, that’s between you and whoever grades your work.
        </p>
        <h2>Our newsroom</h2>
        <p>
          Our reporters and editors work remotely across North America and Europe. Stories are assigned, edited and
          fact-checked to the same standard, which is to say that none of the facts are real but all of them are
          checked for internal consistency. Some of our worse ideas come from readers through our{' '}
          <a href="/tips">tip line</a>, which is anonymous and comes with no credit whatsoever. THANK YOU!
        </p>
        <h2>Funding</h2>
        <p>
          {site.name} is in the same category as The Guardian (independent funded by the laughter of our readers), o
            kay quality of the news is maybe even better here.
            We are editorially independent. See our <a href="/ethics">Ethics Policy</a> for details.
        </p>
        <h2>Get in touch</h2>
        <p>
          Story ideas go to the <a href="/tips">tip line</a>. Corrections and everything else go through our{' '}
          <a href="/contact">contact page</a>. Complaints that a story is fake will be forwarded to the proper
            paragraph above.
        </p>
      </>
    ),
  },
  ethics: {
    title: 'Ethics Policy',
    description: `The standards that govern how ${site.name} reports, edits and publishes.`,
    body: () => (
      <>
        <p class="lede">
          This policy sets out the standards {site.name} applies to everything it publishes. It applies to every
          member of our editorial staff and to freelance contributors.
        </p>
        <h2>Independence</h2>
        <p>
          Editorial decisions are made by editors alone. Mostly by our Editor-in-Grand-Vision.
            Advertisers, investors and sponsors have no role in deciding
          what we cover or how. Sponsored content, if we ever publish it, will be clearly labeled as such.
        </p>
        <h2>Conflicts of interest</h2>
        <p>
          Staff may not write about companies they own shares in, unless the shares are worthless, in which case
          it counts as experience. Conflicts must be disclosed to an editor before work begins. So far this year,
          staff have disclosed four crypto wallets, eleven abandoned startups and a stake in a company that turned
          out to be a group chat.
        </p>
        <h2>Gifts and travel</h2>
        <p>
          We do not accept gifts worth more than a lanyard. Review units go back after testing, or stay until the
          company forgets, which takes about two weeks. We pay for our own travel, which is why every conference
          we cover is the nearest one.
        </p>
        <h2>Sourcing</h2>
        <p>
          We prefer named sources. When a source is anonymous, an editor knows who they are and the story says
          why. We do not pay sources. We have bought several of them coffee, and one of them a sandwich, which the
          standards editor is still reviewing.
        </p>
        <h2>Satire</h2>
        <p>
          Everything here is made up. When real people appear, we only use what they’ve said and done in public,
          usually on a podcast, usually for three hours.
        </p>
        <p>
          If a story here ever reads as entirely plausible, please understand that this is a problem with the
          technology industry, not with our standards.
        </p>
        <h2>Corrections</h2>
        <p>
          We correct errors promptly and transparently. See our <a href="/corrections">Corrections</a> page.
        </p>
      </>
    ),
  },
  corrections: {
    title: 'Corrections',
    description: `How ${site.name} handles errors, and a record of corrections we have made.`,
    body: () => (
      <>
        <p class="lede">
          {site.name} strives to be accurate. When we get something wrong, we fix it and say so.
        </p>
        <h2>Our policy</h2>
        <p>
          Significant errors are corrected in the story with a note at the bottom explaining what was changed and
          when. Minor changes, such as fixing a typo, are made without a note. We do not remove published stories
          except for legal reasons.
        </p>
        <h2>Requesting a correction</h2>
        <p>
          If you believe we have made an error, please write to us through our <a href="/contact">contact page</a>{' '}
          with a link to the story and a description of the problem. An editor reviews every request.
        </p>
        <h2>Recent corrections</h2>
        <ul class="corrections-list">
          <li>
            <strong>October 28, 2026.</strong> An earlier version of a story about a smart refrigerator misstated
            the number of firmware updates it required before dispensing ice. It was 14, not 11.
          </li>
          <li>
            <strong>October 19, 2026.</strong> An earlier version of a story misidentified the company that had
            pivoted to AI. It was a different company that had pivoted to AI.
          </li>
        </ul>
      </>
    ),
  },
  contact: {
    title: 'Contact',
    description: `How to reach the ${site.name} newsroom.`,
    body: () => (
      <>
        <p class="lede">We don't read everything we receive, though we can't reply to every message.</p>
        <h2>News tips</h2>
        <p>
          Have a headline or saw something absurd? Use the <a href="/tips">tip line</a>. It’s anonymous, there’s no
          credit, and whatever you send is free for anyone to use.
        </p>
        <h2>Corrections</h2>
        <p>
          To report an error, email <a href="mailto:corrections@bloatberg.com">corrections@bloatberg.com</a> with a link
          to the story. See our <a href="/corrections">corrections policy</a>.
        </p>
        <h2>Everything else</h2>
        <p>
          For general questions, partnership inquiries and press, email{' '}
          <a href="mailto:hello@bloatberg.com">hello@bloatberg.com</a>.
        </p>
      </>
    ),
  },
}

staticPages.privacy = {
  title: 'Privacy Policy',
  description: `How ${site.name} handles the very small amount of information it has about you.`,
  body: () => (
    <>
      <p class="lede">
        We collect almost nothing about you. This is not a principled stance so much as a lack of interest, but the
        outcome is the same.
      </p>
      <p>Last updated November 1, 2026. Questions: <a href={`mailto:${site.privacyEmail}`}>{site.privacyEmail}</a>.</p>

      <h2>Reading the site</h2>
      <p>
        No cookies, no ads, no trackers. We count how many times each article is read per day, and which website
        sent the reader. The count isn’t linked to you.
      </p>

      <h2>Tips</h2>
      <p>
        We store what you send and a one-way hash of your network address, so one connection can’t flood the tip
        line. The hash can’t be turned back into an address.
      </p>

      <h2 id="newsletter">The newsletter</h2>
      <p>
        If you sign up for {site.newsletter}, we store your email address, when you signed up, and whether you’ve
        unsubscribed. We use it to send {site.newsletter} and nothing else. We don’t sell it or share it with
        advertisers. Unsubscribe with the link in any email, or write to us and we’ll delete your address.
      </p>

      <h2 id="providers">Cloudflare</h2>
      <p>
        {site.name} runs on Cloudflare. Every request passes through Cloudflare’s network, which keeps short-lived
        logs, including IP addresses, under its own{' '}
        <a href="https://www.cloudflare.com/privacypolicy/" rel="noopener">privacy policy</a>. Our database and images
        are stored with Cloudflare too. When the newsletter starts sending, the email service we use will be named
        here.
      </p>
    </>
  ),
}

staticPages.terms = {
  title: 'Terms of Service',
  description: `The terms under which you may read ${site.name}, which are mostly that you understand it is satire.`,
  body: () => (
    <>
      <p class="lede">
        By reading this website you agree to the following terms. By reading this sentence you have already agreed to
        most of them.
      </p>
      <p>Last updated November 1, 2026.</p>
      <h2>1. It is satire</h2>
      <p>
        Everything published on {site.name} is satire. The stories are invented and the quotes were never said.
        When real people or companies appear, it is parody of their public persona, not a statement of fact. Any
        resemblance to real events is the industry’s fault, not ours.
      </p>
      <h2>2. Do not cite us</h2>
      <p>
        You may not present anything on this site as fact: in a report, a pitch deck, a court filing, a term paper or
        an argument with a relative. If you do, what happens next is on you, and it will be embarrassing.
      </p>
      <h2>3. Sharing is fine</h2>
      <p>
        You may link to and quote our stories with attribution. You may screenshot them, provided you do not crop out
        the part that makes it obvious.
      </p>
      <h2>4. Tips</h2>
      <p>
        Anything you send through our <a href="/tips">tip line</a> is given freely, without conditions, credit or
        compensation. We may use it, change it, combine it or ignore it.
      </p>
      <h2 id="newsletter">5. The newsletter</h2>
      <p>
        {site.newsletter} is free: the week’s five most-read stories, every Friday. It is also satire. We won’t sell
        your address. Unsubscribe any time with the link in every email. We may change it or stop it whenever we
        like. Details are in the <a href="/privacy#newsletter">privacy policy</a>.
      </p>
      <h2>6. Hosting</h2>
      <p>
        {site.name} runs on Cloudflare, which processes every request to the site. See the{' '}
        <a href="/privacy#providers">privacy policy</a>.
      </p>
      <h2>7. Changes</h2>
      <p>
        We may update these terms. Continued reading means you accept the new terms, the old terms, and any terms we
        think of later.
      </p>
    </>
  ),
}

/** The staff box: leadership from config, reporters from the authors table. */
export function Masthead({ siteUrl, authors }: { siteUrl: string; authors: Author[] }) {
  const reporters = authors.filter((a) => a.title || a.bio)
  return (
    <Layout siteUrl={siteUrl} meta={{ title: 'Masthead', path: '/masthead', description: `The editors, reporters and staff of ${site.name}.` }}>
      <article class="wrap masthead-page">
        <header class="masthead-page-head">
          <p class="masthead-page-np">{site.name}</p>
          <p class="masthead-page-sub">Established {site.founded} · Technology, reported.</p>
        </header>
        {MASTHEAD.map((g) => (
          <section class="mh-group">
            <h2 class="mh-h">{g.group}</h2>
            <ul class="mh-list">
              {g.people.map((p) => (
                <li>
                  <span class="mh-name">{p.name}</span>
                  <span class="mh-title">{p.title}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {reporters.length > 0 && (
          <section class="mh-group">
            <h2 class="mh-h">Reporters</h2>
            <ul class="mh-list">
              {reporters.map((a) => (
                <li>
                  <a class="mh-name" href={`/author/${a.slug}`}>{a.name}</a>
                  <span class="mh-title">{a.title || 'Reporter'}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
        <p class="mh-fine">
          {site.name} is a work of satire. The people listed on this page are fictional.
        </p>
      </article>
    </Layout>
  )
}

export function Static({ siteUrl, slug }: { siteUrl: string; slug: string }) {
  const page = staticPages[slug]!
  return (
    <StaticPage siteUrl={siteUrl} path={`/${slug}`} title={page.title} description={page.description}>
      {page.body()}
    </StaticPage>
  )
}

export function Newsletter({ siteUrl, state, email = '', week = [] }: {
  siteUrl: string; state?: NewsletterState; email?: string; week?: PublishedStory[]
}) {
  return (
    <Layout
      siteUrl={siteUrl}
      meta={{
        title: site.newsletter,
        description: `${site.newsletter}: the week’s five most-read stories on ${site.name}, every Friday.`,
        path: '/newsletter',
      }}
    >
      <section class="wrap newsletter">
        <p class="newsletter-eyebrow">A newsletter from {site.name}</p>
        <h1 class="newsletter-title">{site.newsletter}</h1>
        <p class="newsletter-copy">The week’s five most-read stories on {site.name}. Every Friday.</p>
        {state === 'subscribed' ? (
          <div class="nl-done" role="status">
            <p class="nl-done-h">You’re on the list.</p>
            <p>The first one arrives on Friday.</p>
          </div>
        ) : (
          <NewsletterForm state={state} email={email} id="signup" />
        )}
        {week.length > 0 && (
          <section class="nl-week" aria-label="This week so far">
            <h2 class="nl-week-h">This week so far</h2>
            <ol>
              {week.map((s) => (
                <li>
                  <span class="nl-week-sec">{sectionName(s.section)}</span>
                  <a href={articlePath(s)}>{s.title}</a>
                </li>
              ))}
            </ol>
          </section>
        )}
      </section>
    </Layout>
  )
}

export function Unsubscribe({ siteUrl, token, state }: { siteUrl: string; token: string; state: 'confirm' | 'done' | 'unknown' }) {
  return (
    <Layout siteUrl={siteUrl} meta={{ title: 'Unsubscribe', path: '/newsletter/unsubscribe', noindex: true }}>
      <section class="wrap newsletter">
        <p class="newsletter-eyebrow">{site.newsletter}</p>
        {state === 'done' && (
          <>
            <h1 class="static-title">You’re unsubscribed.</h1>
            <p class="newsletter-copy">You won’t get any more emails from us.</p>
          </>
        )}
        {state === 'unknown' && (
          <>
            <h1 class="static-title">We couldn’t find that subscription.</h1>
            <p class="newsletter-copy">
              The link may be old, or you’re already unsubscribed. Write to{' '}
              <a href={`mailto:${site.privacyEmail}`}>{site.privacyEmail}</a> and we’ll remove you by hand.
            </p>
          </>
        )}
        {state === 'confirm' && (
          <>
            <h1 class="static-title">Unsubscribe from {site.newsletter}?</h1>
            <form method="post" action="/newsletter/unsubscribe">
              <input type="hidden" name="t" value={token} />
              <button class="btn" type="submit">Unsubscribe</button>
            </form>
          </>
        )}
      </section>
    </Layout>
  )
}
