/**
 * One-way hash of an IP address for rate limiting: an HMAC keyed with the secret IP_HASH_SALT,
 * so without the secret a hash can't be turned back into an address by trying every IP.
 * `purpose` keeps hashes from matching across features.
 */
export async function ipHash(salt: string | undefined, purpose: string, ip: string) {
  if (!salt) throw new Error('IP_HASH_SALT is not set (bunx wrangler secret put IP_HASH_SALT)')
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(salt), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const d = await crypto.subtle.sign('HMAC', key, enc.encode(`${purpose}:${ip}`))
  return [...new Uint8Array(d)].slice(0, 16).map((b) => b.toString(16).padStart(2, '0')).join('')
}
