-- Share card: the 1200×630 picture shown when a link is shared (headline + nameplate + picture).
ALTER TABLE articles ADD COLUMN share_key TEXT NOT NULL DEFAULT '';  -- R2 key or /placeholder/share/… path
ALTER TABLE articles ADD COLUMN share_for TEXT NOT NULL DEFAULT '';  -- what the card was made for; regenerated when it changes
