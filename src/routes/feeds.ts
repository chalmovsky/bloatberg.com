import { Hono } from 'hono'
import { sectionName, site } from '../config'
import { articlePath, imageUrl, listPublished } from '../db/articles'
import { isoDate, rfc822 } from '../lib/dates'
import { excerpt } from '../lib/markdown'
import type { AppEnv } from '../env'
import { staticPages } from '../views/pages/Static'

export const feedRoutes = new Hono<AppEnv>()

const xml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
const cdata = (s: string) => `<![CDATA[${s.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`

feedRoutes.get('/feed.xml', async (c) => {
  const base = c.env.SITE_URL
  const abs = (p: string) => new URL(p, base).toString()
  const stories = await listPublished(c.env.DB, 30)
  const items = stories
    .map((s) => {
      const link = abs(articlePath(s))
      const img = s.image_key ? `\n      <media:content url="${xml(abs(imageUrl(s.image_key)))}" medium="image" />` : ''
      return `    <item>
      <title>${xml(s.title)}</title>
      <link>${xml(link)}</link>
      <guid isPermaLink="true">${xml(link)}</guid>
      <pubDate>${rfc822(s.published_at)}</pubDate>
      <dc:creator>${xml(s.author_name)}</dc:creator>
      <category>${xml(sectionName(s.section))}</category>
      <description>${xml(s.dek || excerpt(s.body_md))}</description>
      <content:encoded>${cdata(s.body_html)}</content:encoded>${img}
    </item>`
    })
    .join('\n')
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${xml(site.name)}</title>
    <link>${xml(abs('/'))}</link>
    <description>${xml(site.description)}</description>
    <language>en-us</language>
    <atom:link href="${xml(abs('/feed.xml'))}" rel="self" type="application/rss+xml" />
    ${stories[0] ? `<lastBuildDate>${rfc822(stories[0].published_at)}</lastBuildDate>` : ''}
${items}
  </channel>
</rss>`
  return c.body(body, 200, {
    'Content-Type': 'application/rss+xml; charset=utf-8',
    'Cache-Control': 'public, max-age=300',
  })
})

feedRoutes.get('/sitemap.xml', async (c) => {
  const base = c.env.SITE_URL
  const abs = (p: string) => xml(new URL(p, base).toString())
  const stories = await listPublished(c.env.DB, 5000)
  const fixed = ['/', ...site.sections.map((s) => `/section/${s.slug}`), ...Object.keys(staticPages).map((p) => `/${p}`), '/newsletter', '/tips', '/briefs', '/masthead']
  const urls = [
    ...fixed.map((p) => `  <url><loc>${abs(p)}</loc></url>`),
    ...stories.map((s) => `  <url><loc>${abs(articlePath(s))}</loc><lastmod>${isoDate(s.updated_at)}</lastmod></url>`),
  ]
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`
  return c.body(body, 200, { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' })
})

feedRoutes.get('/robots.txt', (c) => {
  const body = `User-agent: *
Allow: /
Disallow: /admin

Sitemap: ${new URL('/sitemap.xml', c.env.SITE_URL).toString()}
`
  return c.text(body, 200, { 'Cache-Control': 'public, max-age=86400' })
})
