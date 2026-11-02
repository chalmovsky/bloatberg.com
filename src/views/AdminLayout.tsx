import type { Child } from 'hono/jsx'
import { raw } from 'hono/html'
import { site } from '../config'
import { asset } from '../lib/assets'
import type { Author } from '../db/authors'

interface Props {
  title: string
  author: Author
  active?: 'articles' | 'new' | 'pitches' | 'stats' | 'subscribers' | 'profile' | 'authors'
  children: Child
  script?: boolean
}

export function AdminLayout({ title, author, active, children, script }: Props) {
  const nav = (key: Props['active'], href: string, label: string) => (
    <a href={href} class={active === key ? 'active' : undefined}>{label}</a>
  )
  return (
    <>
      {raw('<!doctype html>')}
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="robots" content="noindex, nofollow" />
          <title>{title} · {site.name} CMS</title>
          <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
          <link rel="stylesheet" href={asset('/css/site.css')} />
          <link rel="stylesheet" href={asset('/css/admin.css')} />
          {script && <script src={asset('/admin/editor.js')} defer></script>}
        </head>
        <body class="admin">
          <header class="admin-bar">
            <div class="admin-bar-inner">
              <a class="admin-brand" href="/admin">
                <span class="nameplate nameplate-admin">{site.name}</span>
                <span class="admin-brand-tag">CMS</span>
              </a>
              <nav class="admin-nav">
                {nav('articles', '/admin', 'Articles')}
                {nav('new', '/admin/new', 'New article')}
                {nav('pitches', '/admin/pitches', 'Pitches')}
                {nav('stats', '/admin/stats', 'Stats')}
                {author.role === 'owner' && nav('subscribers', '/admin/subscribers', 'Subscribers')}
                {author.role === 'owner' && nav('authors', '/admin/authors', 'Authors')}
              </nav>
              <div class="admin-user">
                <a href="/admin/profile" class={active === 'profile' ? 'active' : undefined}>{author.name}</a>
                <a href="/" target="_blank">View site</a>
                <a href="/cdn-cgi/access/logout">Sign out</a>
              </div>
            </div>
          </header>
          <main class="admin-main">{children}</main>
        </body>
      </html>
    </>
  )
}

export function Notice({ msg }: { msg?: string }) {
  const map: Record<string, [string, string]> = {
    saved: ['ok', 'Draft saved.'],
    updated: ['ok', 'Changes saved.'],
    published: ['ok', 'Published. The story is live.'],
    unpublished: ['ok', 'Unpublished. The story is back in drafts.'],
    'subscriber-deleted': ['ok', 'Subscriber deleted.'],
    'live-ended': ['ok', 'Live coverage ended. It no longer shows as live; every update stays on the page.'],
    'live-resumed': ['ok', 'Live coverage resumed. Add an update to put it back at the top.'],
    deleted: ['ok', 'Article deleted.'],
    profile: ['ok', 'Profile updated.'],
    'need-image': ['err', 'Add an image before publishing. Your changes were saved as a draft.'],
    'need-title': ['err', 'A headline is required.'],
    'slug-taken': ['err', 'That URL slug is already in use, so a number was added to it.'],
    forbidden: ['err', 'You can’t do that to something someone else owns.'],
    'from-pitch': ['ok', 'Draft created from a reader tip. No credit needed — it’s public domain.'],
    'pitch-claimed': ['ok', 'Claimed. It’s yours until you unclaim it or turn it into a draft.'],
    'pitch-taken': ['err', 'Someone already claimed that one.'],
    'pitch-rejected': ['ok', 'Rejected.'],
    'pitch-deleted': ['ok', 'Pitch deleted.'],
  }
  const m = msg ? map[msg] : undefined
  if (!m) return null
  return <div class={`notice notice-${m[0]}`} role="status">{m[1]}</div>
}
