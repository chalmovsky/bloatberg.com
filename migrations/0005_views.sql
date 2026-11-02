-- Anonymous page-view counts: one row per article per day (site timezone), plus where readers came from.
-- No IPs, cookies or user identifiers are stored.
CREATE TABLE article_views (
  article_id  INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  day         TEXT NOT NULL,                 -- 'YYYY-MM-DD' in America/New_York
  views       INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (article_id, day)
) WITHOUT ROWID;
CREATE INDEX idx_article_views_day ON article_views (day);

CREATE TABLE article_sources (
  article_id  INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  day         TEXT NOT NULL,
  source      TEXT NOT NULL,                 -- referring site ("news.ycombinator.com"), "Front page", "Direct"…
  views       INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (article_id, day, source)
) WITHOUT ROWID;
CREATE INDEX idx_article_sources_day ON article_sources (day);
