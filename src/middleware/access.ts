import { createMiddleware } from 'hono/factory'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { upsertAuthor } from '../db/authors'
import type { AppEnv, Bindings } from '../env'

let jwks: ReturnType<typeof createRemoteJWKSet> | undefined
let jwksIssuer: string | undefined

export async function verifyAccess(token: string, env: Bindings): Promise<string> {
  const issuer = `https://${env.ACCESS_TEAM_DOMAIN}`
  if (!jwks || jwksIssuer !== issuer) {
    jwks = createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`))
    jwksIssuer = issuer
  }
  const { payload } = await jwtVerify(token, jwks, { issuer, audience: env.ACCESS_AUD })
  if (typeof payload.email !== 'string' || !payload.email) throw new Error('Token has no email claim')
  return payload.email.toLowerCase()
}

/** Resolves the signed-in author from Cloudflare Access (or the local dev bypass). */
export const requireAccess = createMiddleware<AppEnv>(async (c, next) => {
  let email: string | undefined

  if (c.env.ENVIRONMENT === 'development' && c.env.DEV_AUTH_EMAIL) {
    // Local only: Access doesn't exist on localhost.
    email = c.env.DEV_AUTH_EMAIL.trim().toLowerCase()
  } else {
    const token = c.req.header('Cf-Access-Jwt-Assertion')
    if (!token) return c.text('Forbidden', 403)
    try {
      email = await verifyAccess(token, c.env)
    } catch {
      return c.text('Forbidden', 403)
    }
  }

  const author = await upsertAuthor(c.env.DB, email, c.env.OWNER_EMAIL)
  c.set('author', author)
  await next()
})

/** CSRF guard: every admin POST must come from this site. */
export const requireSameOrigin = createMiddleware<AppEnv>(async (c, next) => {
  if (c.req.method !== 'GET' && c.req.method !== 'HEAD') {
    const origin = c.req.header('Origin')
    const allowed = new Set([new URL(c.req.url).origin])
    try {
      allowed.add(new URL(c.env.SITE_URL).origin)
    } catch {}
    if (!origin || !allowed.has(origin)) return c.text('Bad origin', 403)
  }
  await next()
})
