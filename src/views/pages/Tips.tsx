import { site } from '../../config'
import { Layout } from '../Layout'

interface Props {
  siteUrl: string
  state?: 'sent' | 'error' | 'slow-down'
  values?: { kind?: string; body?: string }
}

const MESSAGES = {
  sent: ['ok', 'Got it. Your idea now belongs to everyone, which legally means it belongs to no one.'],
  error: ['err', 'That one came through empty. Ideas work better with words in them.'],
  'slow-down': ['err', 'That’s a lot of tips in one hour. Admirable, honestly. Try again a bit later.'],
} as const

export function Tips({ siteUrl, state, values = {} }: Props) {
  const msg = state ? MESSAGES[state] : undefined
  const kind = values.kind === 'observation' ? 'observation' : 'headline'
  return (
    <Layout
      siteUrl={siteUrl}
      meta={{
        title: 'Send us a tip',
        description: `Seen something in tech that’s too absurd to be real? Send it to ${site.name}.`,
        path: '/tips',
      }}
    >
      <section class="wrap tips">
        <p class="tips-eyebrow">Tips</p>
        <h1 class="tips-title">Send us a tip</h1>
        <p class="tips-lede">
          Seen something in tech that’s too absurd to be real? It probably is real. Tell us anyway. Headline ideas,
          things you overheard at a standup, a changelog that made you put your laptop down anything.
        </p>

        {msg && <p class={`tips-msg tips-msg-${msg[0]}`} role="status">{msg[1]}</p>}

        <form class="tips-form" method="post" action="/tips">
          <fieldset class="tips-kind">
            <legend class="visually-hidden">What are you sending?</legend>
            <label>
              <input type="radio" name="kind" value="headline" checked={kind === 'headline'} />
              <span>
                <strong>A headline</strong>
                <small>“Startup pivots to pivoting”</small>
              </span>
            </label>
            <label>
              <input type="radio" name="kind" value="observation" checked={kind === 'observation'} />
              <span>
                <strong>Something I noticed</strong>
                <small>An absurd thing that actually happened</small>
              </span>
            </label>
          </fieldset>

          <label class="visually-hidden" for="tip-body">Your tip</label>
          <textarea id="tip-body" name="body" rows={5} maxlength={1000} required
            placeholder="Type it like you’d tell a friend. We’ll make it sound like news.">{values.body ?? ''}</textarea>

          {/* Bots fill in every field. People can't see this one. */}
          <div class="tips-hp" aria-hidden="true">
            <label>Website <input type="text" name="website" tabindex={-1} autocomplete="off" /></label>
          </div>

          <button type="submit" class="btn">Send it</button>
        </form>

        <div class="tips-fine">
          <h2>The deal, in full</h2>
          <ul>
            <li><strong>No names, no emails, no credit.</strong> We don’t ask who you are and we won’t say where it came from.</li>
            <li><strong>It’s not yours anymore.</strong> Whatever you send is a gift to the public domain. Anyone can use it, including us.</li>
            <li><strong>No payment, no thank-you note, no updates.</strong> You won’t know if we used it. Probably, neither will we</li>
            <li><strong>No take-backs.</strong> Think of it as open source for jokes.</li>
          </ul>
          <p class="tips-legal">
            The boring version: by submitting, you confirm the idea is yours to give and you waive all rights to it,
            dedicating it to the public domain under{' '}
            <a href="https://creativecommons.org/publicdomain/zero/1.0/" rel="noopener">CC0 1.0</a>. Please don’t
            send anything confidential, defamatory, or about a real person that you wouldn’t say to their face.
          </p>
        </div>
      </section>
    </Layout>
  )
}
