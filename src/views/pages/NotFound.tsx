import type { PublishedStory } from '../../db/articles'
import { Layout } from '../Layout'
import { LatestList } from '../components'

export function NotFound({ siteUrl, path, latest }: { siteUrl: string; path: string; latest: PublishedStory[] }) {
  return (
    <Layout siteUrl={siteUrl} meta={{ title: 'Page not found', path, noindex: true }}>
      <div class="wrap notfound">
        <p class="notfound-code">404</p>
        <h1 class="notfound-title">We can’t find the page you’re looking for.</h1>
        <p class="notfound-copy">
          The link may be broken, or the page may have been moved. Try the <a href="/">front page</a>, or read one of
          our latest stories.
        </p>
        {latest.length > 0 && <LatestList stories={latest} title="Latest stories" />}
      </div>
    </Layout>
  )
}
