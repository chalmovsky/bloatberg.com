import { sectionName } from '../../../config'
import { articlePath, type Story } from '../../../db/articles'
import type { Author } from '../../../db/authors'
import { shortDate } from '../../../lib/dates'
import { AdminLayout, Notice } from '../../AdminLayout'

export function AdminList({ author, articles, views, msg }: {
  author: Author; articles: Story[]; views: Map<number, { total: number; week: number }>; msg?: string
}) {
  const drafts = articles.filter((a) => a.status === 'draft').length
  return (
    <AdminLayout title="Articles" author={author} active="articles">
      <div class="admin-head">
        <div>
          <h1>Articles</h1>
          <p class="admin-sub">{articles.length} total · {drafts} {drafts === 1 ? 'draft' : 'drafts'}</p>
        </div>
        <a class="btn" href="/admin/new">New article</a>
      </div>
      <Notice msg={msg} />
      {articles.length === 0 ? (
        <p class="empty">No articles yet. <a href="/admin/new">Write the first one.</a></p>
      ) : (
        <div class="table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Headline</th>
                <th>Section</th>
                <th>Author</th>
                <th>Status</th>
                <th>Published</th>
                <th class="num">Views</th>
                <th><span class="visually-hidden">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {articles.map((a) => {
                const canEdit = author.role === 'owner' || a.author_id === author.id
                return (
                  <tr>
                    <td class="col-title">
                      {canEdit ? <a href={`/admin/edit/${a.id}`}>{a.title}</a> : a.title}
                      {a.featured ? <span class="tag">Featured</span> : null}
                      {a.format !== 'story' && (
                        <span class="tag tag-fmt">{a.format === 'live' ? (a.live_ended_at ? 'Live · ended' : 'Live') : 'Brief'}</span>
                      )}
                    </td>
                    <td>{sectionName(a.section)}</td>
                    <td>{a.author_name}</td>
                    <td>
                      <span class={`status status-${a.status}`}>{a.status === 'draft' ? 'Draft' : 'Published'}</span>
                    </td>
                    <td class="col-date">{a.published_at ? shortDate(a.published_at) : '—'}</td>
                    <td class="num col-views">
                      {views.get(a.id) ? (
                        <a href={`/admin/stats/${a.id}`} title="All-time views · last 7 days">
                          {views.get(a.id)!.total.toLocaleString('en-US')}
                          <small>{views.get(a.id)!.week.toLocaleString('en-US')} this week</small>
                        </a>
                      ) : (
                        <span class="muted">—</span>
                      )}
                    </td>
                    <td class="col-actions">
                      {canEdit && <a href={`/admin/edit/${a.id}`}>Edit</a>}
                      {a.status === 'published' ? (
                        <a href={articlePath(a)} target="_blank">View</a>
                      ) : (
                        canEdit && <a href={`/admin/view/${a.id}`} target="_blank">Preview</a>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  )
}
