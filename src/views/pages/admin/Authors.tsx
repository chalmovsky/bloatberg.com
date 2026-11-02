import type { Author } from '../../../db/authors'
import { shortDate } from '../../../lib/dates'
import { AdminLayout } from '../../AdminLayout'

export function Authors({ author, authors }: { author: Author; authors: (Author & { article_count: number })[] }) {
  return (
    <AdminLayout title="Authors" author={author} active="authors">
      <div class="admin-head">
        <div>
          <h1>Authors</h1>
          <p class="admin-sub">
            To invite someone, add their email to the Cloudflare Access policy. They appear here after their first sign-in.
          </p>
        </div>
      </div>
      <div class="table-wrap">
        <table class="admin-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Articles</th><th>Joined</th></tr>
          </thead>
          <tbody>
            {authors.map((a) => (
              <tr>
                <td class="col-title"><a href={`/author/${a.slug}`} target="_blank">{a.name}</a></td>
                <td>{a.email}</td>
                <td>{a.role === 'owner' ? 'Owner' : 'Editor'}</td>
                <td>{a.article_count}</td>
                <td class="col-date">{shortDate(a.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  )
}
