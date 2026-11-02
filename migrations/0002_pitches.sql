-- Reader tips: headline ideas and observations. Anonymous, uncredited, public domain.
CREATE TABLE pitches (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  kind        TEXT NOT NULL CHECK (kind IN ('headline','observation')),
  body        TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','claimed','used','rejected')),
  claimed_by  INTEGER REFERENCES authors(id) ON DELETE SET NULL,
  article_id  INTEGER REFERENCES articles(id) ON DELETE SET NULL,
  ip_hash     TEXT NOT NULL DEFAULT '',          -- for rate limiting only; not an identity
  created_at  INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX idx_pitches_status ON pitches (status, created_at DESC);
CREATE INDEX idx_pitches_ip     ON pitches (ip_hash, created_at);

CREATE TABLE pitch_votes (
  pitch_id   INTEGER NOT NULL REFERENCES pitches(id) ON DELETE CASCADE,
  author_id  INTEGER NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
  PRIMARY KEY (pitch_id, author_id)
);
