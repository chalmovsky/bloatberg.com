-- Newsletter sign-ups. Only what's needed to send the newsletter and honor unsubscribes.
CREATE TABLE subscribers (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  email            TEXT NOT NULL UNIQUE COLLATE NOCASE,
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','unsubscribed')),
  token            TEXT NOT NULL UNIQUE,          -- for confirm / unsubscribe links
  terms_version    TEXT NOT NULL,                 -- which newsletter terms they agreed to
  ip_hash          TEXT NOT NULL DEFAULT '',      -- one-way hash, for rate limiting only
  created_at       INTEGER NOT NULL DEFAULT (unixepoch()),
  confirmed_at     INTEGER,
  unsubscribed_at  INTEGER
);
CREATE INDEX idx_subscribers_status ON subscribers (status, created_at DESC);
CREATE INDEX idx_subscribers_ip ON subscribers (ip_hash, created_at);
