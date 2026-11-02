import type { Author } from '../../../db/authors'
import type { PitchRow, PitchStatus } from '../../../db/pitches'
import { relativeTime } from '../../../lib/dates'
import { AdminLayout, Notice } from '../../AdminLayout'

type Tab = PitchStatus | 'open'

interface Props {
  author: Author
  tab: Tab
  pitches: PitchRow[]
  counts: Record<PitchStatus, number>
  msg?: string
}

export function Pitches({ author, tab, pitches, counts, msg }: Props) {
  const tabs: [Tab, string, number][] = [
    ['open', 'Open', counts.new + counts.claimed],
    ['used', 'Used', counts.used],
    ['rejected', 'Rejected', counts.rejected],
  ]
  const back = `?tab=${tab}`
  const action = (id: number, what: string) => `/admin/pitches/${id}/${what}${back}`

  return (
    <AdminLayout title="Pitches" author={author} active="pitches" script>
      <div class="admin-head">
        <div>
          <h1>Pitches</h1>
          <p class="admin-sub">
            Anonymous reader tips from <a href="/tips" target="_blank">/tips</a>. Public domain, uncredited — use freely.
          </p>
        </div>
      </div>
      <Notice msg={msg} />
      <nav class="tabs">
        {tabs.map(([key, label, n]) => (
          <a href={`/admin/pitches?tab=${key}`} class={tab === key ? 'active' : undefined}>
            {label} <span class="tab-count">{n}</span>
          </a>
        ))}
      </nav>

      {pitches.length === 0 ? (
        <p class="empty">{tab === 'open' ? 'No open pitches. The internet is quiet. Suspiciously quiet.' : 'Nothing here.'}</p>
      ) : (
        <ul class="pitch-list">
          {pitches.map((p) => {
            const mine = p.claimed_by === author.id
            const canAct = p.status === 'new' || mine || author.role === 'owner'
            return (
              <li class={`pitch pitch-${p.status}`}>
                <form method="post" action={action(p.id, 'vote')} class="pitch-vote">
                  <button type="submit" class={p.voted ? 'voted' : undefined} title={p.voted ? 'Remove your vote' : 'Upvote'}>
                    <span aria-hidden="true">▲</span>
                    <span>{p.votes}</span>
                  </button>
                </form>
                <div class="pitch-main">
                  <p class="pitch-meta">
                    <span class={`pitch-kind pitch-kind-${p.kind}`}>{p.kind === 'headline' ? 'Headline' : 'Observation'}</span>
                    <span>{relativeTime(p.created_at)}</span>
                    {p.status === 'claimed' && <span class="pitch-claimed">Claimed by {mine ? 'you' : p.claimer_name ?? 'someone'}</span>}
                    {p.status === 'used' && p.article_id && <a href={`/admin/edit/${p.article_id}`}>Open draft →</a>}
                  </p>
                  <p class={p.kind === 'headline' ? 'pitch-body pitch-headline' : 'pitch-body'}>{p.body}</p>
                </div>
                <div class="pitch-actions">
                  {p.status === 'new' && (
                    <form method="post" action={action(p.id, 'claim')}><button class="btn btn-secondary btn-sm">Claim</button></form>
                  )}
                  {p.status === 'claimed' && canAct && (
                    <form method="post" action={action(p.id, 'unclaim')}><button class="btn btn-ghost btn-sm">Unclaim</button></form>
                  )}
                  {(p.status === 'new' || p.status === 'claimed') && canAct && (
                    <>
                      <form method="post" action={action(p.id, 'draft')}><button class="btn btn-sm">Make draft</button></form>
                      <form method="post" action={action(p.id, 'reject')}><button class="btn btn-ghost btn-sm">Reject</button></form>
                    </>
                  )}
                  {p.status === 'rejected' && (
                    <form method="post" action={action(p.id, 'reopen')}><button class="btn btn-ghost btn-sm">Reopen</button></form>
                  )}
                  {author.role === 'owner' && (
                    <form method="post" action={action(p.id, 'delete')}>
                      <button class="btn btn-danger btn-sm" data-confirm="Delete this pitch for good?">Delete</button>
                    </form>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </AdminLayout>
  )
}
