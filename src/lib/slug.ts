const MAX = 80

/** Lowercase ASCII, words joined by hyphens, max 80 chars. */
export function slugify(input: string): string {
  const s = input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  if (s.length <= MAX) return s
  const cut = s.slice(0, MAX)
  const lastDash = cut.lastIndexOf('-')
  return (lastDash > 40 ? cut.slice(0, lastDash) : cut).replace(/-+$/g, '')
}
