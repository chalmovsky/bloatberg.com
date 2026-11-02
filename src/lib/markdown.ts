import { Marked, type Tokens } from 'marked'
import { isEmbedKind, renderEmbed } from './embeds'

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

/** Only allow http(s), mailto, relative and fragment URLs. */
function safeUrl(href: string): string | null {
  const url = href.trim()
  if (/^(https?:|mailto:)/i.test(url)) return url
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return null // javascript:, data:, vbscript: …
  return url
}

const isExternal = (href: string) => /^https?:\/\//i.test(href)

const marked = new Marked({
  gfm: true,
  breaks: false,
  renderer: {
    // ```thread, ```issue, ```changelog… become embedded artifacts; other fences are code.
    code({ text, lang }: Tokens.Code) {
      const kind = (lang ?? '').trim().split(/\s+/)[0]?.toLowerCase()
      if (isEmbedKind(kind)) return renderEmbed(kind, text, renderMarkdown)
      const cls = kind ? ` class="language-${escapeHtml(kind)}"` : ''
      return `<pre><code${cls}>${escapeHtml(text)}</code></pre>\n`
    },
    // Raw HTML in Markdown is escaped, never rendered.
    html({ text }: Tokens.HTML | Tokens.Tag) {
      return escapeHtml(text)
    },
    link({ href, title, tokens }: Tokens.Link) {
      const text = this.parser.parseInline(tokens)
      const url = safeUrl(href)
      if (!url) return text
      const t = title ? ` title="${escapeHtml(title)}"` : ''
      const rel = isExternal(url) ? ' rel="noopener"' : ''
      return `<a href="${escapeHtml(url)}"${t}${rel}>${text}</a>`
    },
    image({ href, title, text }: Tokens.Image) {
      const url = safeUrl(href)
      if (!url || /^mailto:/i.test(url)) return escapeHtml(text)
      const t = title ? ` title="${escapeHtml(title)}"` : ''
      return `<img src="${escapeHtml(url)}" alt="${escapeHtml(text)}"${t} loading="lazy">`
    },
  },
})

export function renderMarkdown(md: string): string {
  return marked.parse(md, { async: false }) as string
}

export function readMinutes(md: string): number {
  const words = md
    .replace(/^\s*```.*$/gm, ' ') // count the words inside embeds and code, not the fences
    .replace(/[#>*_`~\[\]()!-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length
  return Math.max(1, Math.ceil(words / 230))
}

/** Plain-text excerpt for meta descriptions when there's no dek. */
export function excerpt(md: string, max = 200): string {
  const text = md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (text.length <= max) return text
  return text.slice(0, max).replace(/\s+\S*$/, '') + '…'
}
