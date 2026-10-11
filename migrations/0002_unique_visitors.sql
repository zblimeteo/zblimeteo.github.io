-- Preserve the existing unique visitor table; old deployments created it at runtime.
CREATE TABLE IF NOT EXISTS unique_visitors_v3 (
  visitor_key TEXT PRIMARY KEY,
  visited_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  country_code TEXT,
  country TEXT,
  city TEXT,
  latitude REAL,
  longitude REAL,
  path TEXT NOT NULL
);

-- Keep the country source for future auditing without storing raw IP addresses.
CREATE TABLE IF NOT EXISTS visitor_country_sources (
  visitor_key TEXT PRIMARY KEY REFERENCES unique_visitors_v3(visitor_key),
  source TEXT NOT NULL,
  recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
