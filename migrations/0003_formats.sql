-- Article formats: regular stories, live updates (timestamped, each with its own headline), and briefs (headline-only).
ALTER TABLE articles ADD COLUMN format TEXT NOT NULL DEFAULT 'story' CHECK (format IN ('story','live','brief'));
-- Live updates: computed on save so page views never parse Markdown.
ALTER TABLE articles ADD COLUMN live_latest TEXT NOT NULL DEFAULT '';   -- headline of the newest update
ALTER TABLE articles ADD COLUMN live_count  INTEGER NOT NULL DEFAULT 0; -- number of updates
CREATE INDEX idx_articles_format ON articles (format, status, published_at DESC);
