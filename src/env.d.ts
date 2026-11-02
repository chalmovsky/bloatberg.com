import type { Author } from './db/authors'

export interface Bindings {
  DB: D1Database
  IMAGES: R2Bucket
  ASSETS: Fetcher
  ENVIRONMENT: string
  SITE_URL: string
  OWNER_EMAIL: string
  ACCESS_TEAM_DOMAIN: string
  ACCESS_AUD: string
  /** Secret key for hashing IP addresses (rate limiting). `bunx wrangler secret put IP_HASH_SALT` */
  IP_HASH_SALT?: string
  DEV_AUTH_EMAIL?: string
}

export interface Variables {
  author: Author
}

export type AppEnv = { Bindings: Bindings; Variables: Variables }
