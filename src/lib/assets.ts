// Versioned links to our CSS and JS ("/css/site.css?v=3f9a1c2b"), so browsers fetch a new file
// as soon as it changes instead of mixing a cached stylesheet with a new script.
// The version is the file's ETag from the static assets binding. In production the files can't
// change while this Worker is running, so it's looked up once; in development, on every request.
import type { Bindings } from '../env'

const FILES = ['/css/site.css', '/css/admin.css', '/js/theme.js', '/js/share.js', '/admin/editor.js'] as const
type File = (typeof FILES)[number]

const versions = new Map<string, string>()
let loaded = false
const boot = Date.now().toString(36) // fallback if an ETag can't be read

export async function loadAssetVersions(env: Pick<Bindings, 'ASSETS' | 'ENVIRONMENT'>) {
  if (loaded && env.ENVIRONMENT !== 'development') return
  await Promise.all(
    FILES.map(async (f) => {
      try {
        const res = await env.ASSETS.fetch(new Request(`https://assets.local${f}`, { method: 'HEAD' }))
        const tag = (res.headers.get('ETag') ?? '').replace(/\W/g, '').slice(0, 10)
        versions.set(f, tag || boot)
      } catch {
        versions.set(f, boot)
      }
    }),
  )
  loaded = true
}

export const asset = (f: File) => `${f}?v=${versions.get(f) ?? boot}`
