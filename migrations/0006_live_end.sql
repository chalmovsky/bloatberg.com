-- Live coverage can be ended (archived): it stops being "live" but keeps every update.
ALTER TABLE articles ADD COLUMN live_ended_at INTEGER;  -- NULL = still running
