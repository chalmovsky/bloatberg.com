-- Anonymous visit counts for pages that aren't articles (for now: the front page), plus where visitors came from.
-- Same rules as article_views: no IPs, cookies or user identifiers.
CREATE TABLE page_views (
  page   TEXT NOT NULL,                 -- 'home'
  day    TEXT NOT NULL,                 -- 'YYYY-MM-DD' in America/New_York
  views  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (page, day)
) WITHOUT ROWID;

CREATE TABLE page_sources (
  page   TEXT NOT NULL,
  day    TEXT NOT NULL,
  source TEXT NOT NULL,
  views  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (page, day, source)
) WITHOUT ROWID;
