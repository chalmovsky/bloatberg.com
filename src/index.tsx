import { Hono } from 'hono'
import { listPublished } from './db/articles'
import { loadAssetVersions } from './lib/assets'
import type { AppEnv } from './env'
import { adminRoutes } from './routes/admin'
import { feedRoutes } from './routes/feeds'
import { publicRoutes } from './routes/public'
import { NotFound } from './views/pages/NotFound'

const app = new Hono<AppEnv>()

app.use('*', async (c, next) => {
  await loadAssetVersions(c.env)
  await next()
})

// Security headers on everything the Worker answers (static files get theirs from public/_headers).
const SECURITY_HEADERS: [string, string][] = [
  ['X-Content-Type-Options', 'nosniff'],
  ['Strict-Transport-Security', 'max-age=31536000'],
]
app.use('*', async (c, next) => {
  await next()
  try {
    for (const [k, v] of SECURITY_HEADERS) c.res.headers.set(k, v)
  } catch {
    // Responses from the cache have read-only headers: copy, then set.
    c.res = new Response(c.res.body, c.res)
    for (const [k, v] of SECURITY_HEADERS) c.res.headers.set(k, v)
  }
})

app.route('/admin', adminRoutes)
app.route('/', feedRoutes)
app.route('/', publicRoutes)

app.notFound(async (c) => {
  let latest: Awaited<ReturnType<typeof listPublished>> = []
  try {
    latest = await listPublished(c.env.DB, 5)
  } catch {}
  return c.html(<NotFound siteUrl={c.env.SITE_URL} path={c.req.path} latest={latest} />, 404)
})

app.onError((err, c) => {
  console.error(err)
  return c.text('Something went wrong. Please try again.', 500)
})

export default app
