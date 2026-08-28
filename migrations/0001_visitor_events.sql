CREATE TABLE IF NOT EXISTS visitor_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visited_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  country_code TEXT,
  country TEXT,
  city TEXT,
  latitude REAL,
  longitude REAL,
  path TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_visitor_events_visited_at
ON visitor_events(visited_at);

PRAGMA optimize;
