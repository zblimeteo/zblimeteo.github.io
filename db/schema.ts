export const createVisitorEventsTable = `
  CREATE TABLE IF NOT EXISTS visitor_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visited_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    country_code TEXT,
    country TEXT,
    city TEXT,
    latitude REAL,
    longitude REAL,
    path TEXT NOT NULL
  )
`;

export const createVisitorEventsDateIndex = `
  CREATE INDEX IF NOT EXISTS idx_visitor_events_visited_at
  ON visitor_events(visited_at)
`;

export const createVisitorDevicesTable = `
  CREATE TABLE IF NOT EXISTS visitor_devices (
    visitor_key TEXT PRIMARY KEY,
    first_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`;

export const createUniqueVisitorsTable = `
  CREATE TABLE IF NOT EXISTS unique_visitors_v3 (
    visitor_key TEXT PRIMARY KEY,
    visited_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    country_code TEXT,
    country TEXT,
    city TEXT,
    latitude REAL,
    longitude REAL,
    path TEXT NOT NULL
  )
`;
