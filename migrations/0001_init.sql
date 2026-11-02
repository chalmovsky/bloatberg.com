CREATE TABLE authors (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  email       TEXT NOT NULL UNIQUE,          -- from the Access token
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  bio         TEXT NOT NULL DEFAULT '',
  role        TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('owner','editor')),
  created_at  INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE articles (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  slug          TEXT NOT NULL UNIQUE,
  title         TEXT NOT NULL,
  dek           TEXT NOT NULL DEFAULT '',    -- subheadline, optional
  section       TEXT NOT NULL DEFAULT 'tech',
  body_md       TEXT NOT NULL DEFAULT '',
  body_html     TEXT NOT NULL DEFAULT '',    -- rendered on save
  read_minutes  INTEGER NOT NULL DEFAULT 1,  -- computed on save
  image_key     TEXT NOT NULL,               -- R2 object key
  image_alt     TEXT NOT NULL DEFAULT '',
  image_credit  TEXT NOT NULL DEFAULT '',
  featured      INTEGER NOT NULL DEFAULT 0,  -- 1 = eligible for lead slot
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  author_id     INTEGER NOT NULL REFERENCES authors(id),
  published_at  INTEGER,                     -- set on first publish
  created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at    INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX idx_articles_published ON articles (status, published_at DESC);
CREATE INDEX idx_articles_section   ON articles (section, status, published_at DESC);
