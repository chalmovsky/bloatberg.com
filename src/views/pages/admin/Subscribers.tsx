import { site } from '../../../config'
import type { Author } from '../../../db/authors'
import type { Subscriber } from '../../../db/subscribers'
import { shortDate } from '../../../lib/dates'
import { AdminLayout, Notice } from '../../AdminLayout'

export function Subscribers({ author, counts, subscribers, msg }: {
  author: Author
  counts: { pending: number; confirmed: number; unsubscribed: number }
  subscribers: Subscriber[]
  msg?: string
}) {
  return (
    <AdminLayout title="Subscribers" author={author} active="subscribers">
      <div class="admin-head">
        <div>
          <h1>Subscribers</h1>
          <p class="admin-sub">
            {counts.pending + counts.confirmed} subscribed · {counts.unsubscribed} unsubscribed
          </p>
        </div>
        <a class="btn btn-secondary" href="/admin/subscribers.csv">Download CSV</a>
      </div>
      <Notice msg={msg} />
      <p class="muted subs-note">
        Sign-ups from the newsletter form. The site doesn’t send email: to send {site.newsletter}, download the CSV
        and import it into an email service.
      </p>
      {subscribers.length === 0 ? (
        <p class="empty">No sign-ups yet.</p>
      ) : (
        <div class="table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Status</th>
                <th>Signed up</th>
                <th>Terms</th>
                <th><span class="visually-hidden">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((s) => (
                <tr>
                  <td>{s.email}</td>
                  <td>
                    <span class={`status status-${s.status === 'unsubscribed' ? 'draft' : 'published'}`}>
                      {s.status === 'unsubscribed' ? 'Unsubscribed' : 'Subscribed'}
                    </span>
                  </td>
                  <td class="col-date">{shortDate(s.created_at)}</td>
                  <td class="muted">{s.terms_version}</td>
                  <td class="col-actions">
                    <form method="post" action={`/admin/subscribers/${s.id}/delete`}>
                      <button type="submit" class="link-btn" data-confirm={`Delete ${s.email} permanently?`}>Delete</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  )
}
