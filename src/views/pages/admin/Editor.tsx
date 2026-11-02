import { LABELS, site } from '../../../config'
import { articlePath, imageUrl, type Story } from '../../../db/articles'
import type { Author } from '../../../db/authors'
import { dateParts, dateTimeET, nowSeconds } from '../../../lib/dates'
import { FORMATS } from '../../../lib/body'
import type { ArticleFormat } from '../../../db/articles'
import { AdminLayout, Notice } from '../../AdminLayout'
import { Html } from '../../components'

export interface EditorValues {
  title: string
  dek: string
  section: string
  body_md: string
  body_html: string
  slug: string
  image_key: string
  image_alt: string
  image_credit: string
  label: string
  dateline: string
  share_key: string
  share_for: string
  featured: boolean
  format: ArticleFormat
  /** Byline. 0 = not chosen yet (new article): the section's desk writer is suggested. */
  author_id: number
}

export const emptyValues: EditorValues = {
  title: '', dek: '', section: site.sections[0].slug, body_md: '', body_html: '', slug: '',
  image_key: '', image_alt: '', image_credit: '', label: '', dateline: '', share_key: '', share_for: '', featured: false, format: 'story', author_id: 0,
}

export function valuesFrom(a: Story): EditorValues {
  return {
    title: a.title, dek: a.dek, section: a.section, body_md: a.body_md, body_html: a.body_html, slug: a.slug,
    image_key: a.image_key, image_alt: a.image_alt, image_credit: a.image_credit, featured: a.featured === 1,
    format: a.format, label: a.label, dateline: a.dateline, share_key: a.share_key, share_for: a.share_for,
    author_id: a.author_id,
  }
}

interface Props {
  author: Author
  siteUrl: string
  article?: Story // undefined for a new article
  values: EditorValues
  msg?: string
  /** Everyone who can be credited. Only the owner gets to pick. */
  bylines?: Author[]
}

export function Editor({ author, siteUrl, article, values: v, msg, bylines = [] }: Props) {
  // Section → desk writer's id, for suggesting a byline when the section changes.
  const desks: Record<string, number> = {}
  for (const s of site.sections) {
    const w = bylines.find((b) => b.slug === s.desk)
    if (w) desks[s.slug] = w.id
  }
  const pickByline = author.role === 'owner' && bylines.length > 1
  const bylineId = v.author_id || desks[v.section] || author.id
  const isNew = !article
  const live = article?.status === 'published'
  const action = isNew ? '/admin/articles' : `/admin/articles/${article.id}`
  const [y, m, d] = dateParts(article?.published_at ?? nowSeconds())
  const urlPrefix = `${new URL(siteUrl).host}/${y}/${m}/${d}/`
  const canDelete = !isNew && author.role === 'owner'

  return (
    <AdminLayout title={isNew ? 'New article' : `Edit: ${v.title || 'Untitled'}`} author={author} active={isNew ? 'new' : undefined} script>
      <form class={`editor format-${v.format}`} method="post" action={action} id="editor-form">
        <div class="editor-status">
          <a href="/admin" class="back">← All articles</a>
          <span class={`status status-${live ? 'published' : 'draft'}`}>{live ? 'Published' : 'Draft'}</span>
          {article?.published_at && <span class="muted">First published {dateTimeET(article.published_at)}</span>}
          {article && <span class="muted">Last saved {dateTimeET(article.updated_at)}</span>}
        </div>
        <Notice msg={msg} />

        <label class="visually-hidden" for="f-title">Headline</label>
        <textarea id="f-title" name="title" class="field-headline" rows={1} placeholder="Headline" required maxlength={200}>{v.title}</textarea>

        <label class="visually-hidden" for="f-dek">Subheadline</label>
        <textarea id="f-dek" name="dek" class="field-dek" rows={1} placeholder="Subheadline (optional)" maxlength={400}>{v.dek}</textarea>

        <fieldset class="format-pick">
          <legend class="field-label">Format</legend>
          {FORMATS.map((f) => (
            <label>
              <input type="radio" name="format" value={f.value} checked={v.format === f.value} />
              <span><strong>{f.label}</strong><small>{f.hint}</small></span>
            </label>
          ))}
        </fieldset>

        <div class="field-row">
          <label class="field">
            <span class="field-label">Section</span>
            <select name="section">
              {site.sections.map((s) => (
                <option value={s.slug} selected={v.section === s.slug}>{s.name}</option>
              ))}
            </select>
          </label>
          {pickByline && (
            <label class="field">
              <span class="field-label">Byline</span>
              <select name="author_id" id="f-byline" data-desks={JSON.stringify(desks)} data-auto={v.author_id ? '0' : '1'}>
                {bylines.map((b) => (
                  <option value={String(b.id)} selected={b.id === bylineId}>
                    {b.name}{b.title ? ` — ${b.title}` : ''}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label class="field">
            <span class="field-label">Label</span>
            <select name="label">
              {LABELS.map((l) => (
                <option value={l} selected={v.label === l}>{l || 'None'}</option>
              ))}
            </select>
          </label>
          <label class="field">
            <span class="field-label">Dateline</span>
            <input type="text" name="dateline" value={v.dateline} placeholder="SAN FRANCISCO" maxlength={40} />
          </label>
          <label class="field field-check">
            <input type="checkbox" name="featured" value="1" checked={v.featured} />
            <span>Feature on front page</span>
          </label>
        </div>

        <fieldset class="field-image">
          <legend class="field-label">Image <span class="muted only-not-brief">— required to publish</span><span class="muted only-brief">— optional for briefs</span></legend>
          <input type="hidden" name="image_key" id="f-image-key" value={v.image_key} />
          <div class={`dropzone${v.image_key ? ' has-image' : ''}`} id="dropzone">
            <img id="image-thumb" src={v.image_key ? imageUrl(v.image_key) : ''} alt="" hidden={!v.image_key} />
            <div class="dropzone-copy">
              <p><strong>Drop an image here</strong> or <label class="link" for="f-file">choose a file</label></p>
              <p class="muted">JPEG, PNG or WebP. Resized to 2000 px and converted to WebP in your browser.</p>
              <p class="dropzone-state muted" id="image-state" aria-live="polite"></p>
            </div>
            <input type="file" id="f-file" accept="image/*" class="visually-hidden" />
          </div>
          <div class="field-row">
            <label class="field grow">
              <span class="field-label">Caption / alt text</span>
              <input type="text" name="image_alt" value={v.image_alt} placeholder="Describe the image for readers who can’t see it" maxlength={300} />
            </label>
            <label class="field">
              <span class="field-label">Credit</span>
              <input type="text" name="image_credit" value={v.image_credit} placeholder="Photo: Name / Agency" maxlength={120} />
            </label>
          </div>
        </fieldset>

        <div class="share-card-field">
          <input type="hidden" name="share_key" id="f-share-key" value={v.share_key} />
          <input type="hidden" name="share_for" id="f-share-for" value={v.share_for} />
          <p class="field-label">Share card</p>
          <img id="share-thumb" src={v.share_key ? imageUrl(v.share_key) : ''} alt="Share card preview" hidden={!v.share_key} width="600" height="315" />
          <p class="muted" id="share-state">
            What people see when they share the link. Made automatically when you save, and remade when the headline,
            picture, section or label changes.
          </p>
        </div>

        <div class="field-body">
          <div class="body-pane">
            <div class="pane-head">
              <span class="field-label">Body</span>
              <span class="muted">Markdown · <span id="word-count"></span></span>
            </div>
            <div class="insert-bar" id="insert-bar" hidden>
              <span class="muted">Insert:</span>
              <button type="button" data-insert="update" class="only-live insert-primary">+ Live update</button>
              <button type="button" data-insert="thread">Thread</button>
              <button type="button" data-insert="issue">Issue</button>
              <button type="button" data-insert="changelog">Changelog</button>
              <button type="button" data-insert="chat">Chat</button>
              <button type="button" data-insert="incident">Status page</button>
              <button type="button" data-insert="memo">Memo</button>
              <button type="button" data-insert="review">Review box</button>
              <button type="button" data-insert="quote" title="A pull quote readers can share as a picture">Pull quote</button>
            </div>
            <p class="muted only-live live-help">
              Start each update with <code>@time</code> on its own line, then <code>## Headline</code>, then the text. Newest at the top.
            </p>
            <textarea name="body_md" id="f-body" class="field-md" placeholder="Write the story in Markdown…" spellcheck>{v.body_md}</textarea>
          </div>
          <div class="body-pane">
            <div class="pane-head">
              <span class="field-label">Preview</span>
              <span class="muted" id="preview-state"></span>
            </div>
            <div class="preview-pane">
              <div class={`prose ${v.format === 'live' ? 'live-body' : 'article-body'}`} id="preview"><Html html={v.body_html} /></div>
            </div>
          </div>
        </div>

        <label class="field">
          <span class="field-label">URL slug</span>
          <div class="slug-row">
            <span class="slug-prefix">{urlPrefix}</span>
            <input type="text" name="slug" id="f-slug" value={v.slug} data-auto={isNew || !v.slug ? '1' : '0'}
              pattern="[a-z0-9-]*" maxlength={80} placeholder="generated-from-headline" />
          </div>
        </label>

        <div class="editor-actions">
          <div class="editor-actions-inner">
            {isNew ? (
              <>
                <button type="submit" name="intent" value="save" class="btn btn-secondary">Save draft</button>
                <button type="submit" name="intent" value="publish" class="btn">Publish</button>
              </>
            ) : (
              <>
                <button type="submit" class="btn btn-secondary">{live ? 'Save' : 'Save draft'}</button>
                <button type="submit" class="btn" formaction={`/admin/articles/${article.id}/publish`}>
                  {live ? 'Update' : 'Publish'}
                </button>
                {live && (
                  <button type="submit" class="btn btn-ghost" formaction={`/admin/articles/${article.id}/unpublish`}>
                    Unpublish
                  </button>
                )}
                {live && article.format === 'live' && (
                  article.live_ended_at ? (
                    <button type="submit" class="btn btn-ghost" formaction={`/admin/articles/${article.id}/resume-live`}>
                      Resume live coverage
                    </button>
                  ) : (
                    <button type="submit" class="btn btn-ghost" formaction={`/admin/articles/${article.id}/end-live`}
                      data-confirm="End this live coverage? It stops showing as live, and every update and headline stays on the page. You can resume it later.">
                      End live coverage
                    </button>
                  )
                )}
                <a class="btn btn-ghost" target="_blank"
                  href={live ? articlePath(article) : `/admin/view/${article.id}`}>
                  {live ? 'View on site' : 'Preview'}
                </a>
              </>
            )}
            {canDelete && (
              <button type="submit" class="btn btn-danger" formaction={`/admin/articles/${article!.id}/delete`}
                formnovalidate data-confirm="Delete this article permanently? This cannot be undone.">
                Delete
              </button>
            )}
          </div>
        </div>
      </form>
    </AdminLayout>
  )
}
