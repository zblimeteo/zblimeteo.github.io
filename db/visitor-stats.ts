import type { D1Database } from '@cloudflare/workers-types';
import { createVisitorDevicesTable, createVisitorEventsDateIndex, createVisitorEventsTable } from './schema';

export type VisitorLocation = {
  countryCode: string;
  country: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  visits: number;
};

export type VisitorSnapshot = { total: number; locations: VisitorLocation[] };

export async function ensureVisitorSchema(db: D1Database) {
  await db.batch([
    db.prepare(createVisitorEventsTable),
    db.prepare(createVisitorEventsDateIndex),
    db.prepare(createVisitorDevicesTable),
  ]);
}

export async function recordVisit(db: D1Database, visit: Omit<VisitorLocation, 'visits'> & { path: string; visitorKey: string }) {
  const deviceResult = await db.prepare(`
    INSERT OR IGNORE INTO visitor_devices (visitor_key)
    VALUES (?)
  `).bind(visit.visitorKey).run();

  if (Number(deviceResult.meta.changes ?? 0) === 0) return;

  await db.prepare(`
    INSERT INTO visitor_events (country_code, country, city, latitude, longitude, path)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    visit.countryCode || null,
    visit.country || null,
    visit.city || null,
    typeof visit.latitude === 'number' && Number.isFinite(visit.latitude) ? visit.latitude : null,
    typeof visit.longitude === 'number' && Number.isFinite(visit.longitude) ? visit.longitude : null,
    visit.path,
  ).run();
}

export async function getVisitorSnapshot(db: D1Database): Promise<VisitorSnapshot> {
  const totalResult = await db.prepare('SELECT COUNT(*) AS total FROM visitor_events').first<{ total: number }>();
  const locationResult = await db.prepare(`
    SELECT
      country_code AS countryCode,
      COALESCE(country, country_code) AS country,
      '' AS city,
      ROUND(AVG(latitude), 1) AS latitude,
      ROUND(AVG(longitude), 1) AS longitude,
      COUNT(*) AS visits
    FROM visitor_events
    WHERE country_code IS NOT NULL AND country_code != ''
    GROUP BY country_code, country
    ORDER BY visits DESC
    LIMIT 48
  `).all<VisitorLocation>();

  return { total: Number(totalResult?.total ?? 0), locations: locationResult.results ?? [] };
}
