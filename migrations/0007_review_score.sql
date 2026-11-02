-- Score from an article's review box (0–10), computed on save. NULL when there's no review box.
ALTER TABLE articles ADD COLUMN review_score REAL;
