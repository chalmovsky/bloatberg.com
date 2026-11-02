-- Newsroom furniture: job titles on bylines, story labels and datelines.
ALTER TABLE authors ADD COLUMN title TEXT NOT NULL DEFAULT '';      -- "Senior Correspondent, AI"
ALTER TABLE articles ADD COLUMN label TEXT NOT NULL DEFAULT '';     -- '', Exclusive, Analysis, ...
ALTER TABLE articles ADD COLUMN dateline TEXT NOT NULL DEFAULT '';  -- "SAN FRANCISCO"
