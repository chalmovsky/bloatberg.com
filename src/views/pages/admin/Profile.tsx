import type { Author } from '../../../db/authors'
import { shortDate } from '../../../lib/dates'
import { AdminLayout, Notice } from '../../AdminLayout'

export function Profile({ author, msg, error }: { author: Author; msg?: string; error?: string }) {
  return (
    <AdminLayout title="Your profile" author={author} active="profile">
      <div class="admin-head">
        <div>
          <h1>Your profile</h1>
          <p class="admin-sub">This is how your byline appears on the site. Signed in as {author.email}.</p>
        </div>
        <a class="btn btn-secondary" href={`/author/${author.slug}`} target="_blank">View author page</a>
      </div>
      <Notice msg={msg} />
      {error && <div class="notice notice-err">{error}</div>}
      <form method="post" action="/admin/profile" class="form-narrow">
        <label class="field">
          <span class="field-label">Byline name</span>
          <input type="text" name="name" value={author.name} required maxlength={80} />
        </label>
        <label class="field">
          <span class="field-label">Author page URL</span>
          <div class="slug-row">
            <span class="slug-prefix">/author/</span>
            <input type="text" name="slug" value={author.slug} required pattern="[a-z0-9-]+" maxlength={60} />
          </div>
        </label>
        <label class="field">
          <span class="field-label">Job title</span>
          <input type="text" name="title" value={author.title} maxlength={80} placeholder="Senior Correspondent, AI" />
        </label>
        <label class="field">
          <span class="field-label">Bio</span>
          <textarea name="bio" rows={4} maxlength={500} placeholder="Jane Doe is a senior reporter covering…">{author.bio}</textarea>
        </label>
        <p class="muted">Role: {author.role === 'owner' ? 'Owner' : 'Editor'} · Joined {shortDate(author.created_at)}</p>
        <button type="submit" class="btn">Save profile</button>
      </form>
    </AdminLayout>
  )
}
