import type { D1Database } from '@cloudflare/workers-types';
import { createVisitorEventsDateIndex, createVisitorEventsTable } from './schema';

export type VisitorLocation = {
  countryCode: string;
  country: string;
  city: string;
  latitude: number;
  longitude: number;
  visits: number;
};

export type VisitorSnapshot = { total: number; locations: VisitorLocation[] };

export async function ensureVisitorSchema(db: D1Database) {
  await db.batch([
    db.prepare(createVisitorEventsTable),
    db.prepare(createVisitorEventsDateIndex),
  ]);
}

export async function recordVisit(db: D1Database, visit: Omit<VisitorLocation, 'visits'> & { path: string }) {
  await db.prepare(`
    INSERT INTO visitor_events (country_code, country, city, latitude, longitude, path)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    visit.countryCode || null,
    visit.country || null,
    visit.city || null,
    Number.isFinite(visit.latitude) ? visit.latitude : null,
    Number.isFinite(visit.longitude) ? visit.longitude : null,
    visit.path,
  ).run();
}

export async function getVisitorSnapshot(db: D1Database): Promise<VisitorSnapshot> {
  const totalResult = await db.prepare('SELECT COUNT(*) AS total FROM visitor_events').first<{ total: number }>();
  const locationResult = await db.prepare(`
    SELECT
      country_code AS countryCode,
      COALESCE(country, country_code) AS country,
      COALESCE(city, '') AS city,
      ROUND(latitude, 1) AS latitude,
      ROUND(longitude, 1) AS longitude,
      COUNT(*) AS visits
    FROM visitor_events
    WHERE country_code IS NOT NULL AND latitude IS NOT NULL AND longitude IS NOT NULL
    GROUP BY country_code, country, city, ROUND(latitude, 1), ROUND(longitude, 1)
    ORDER BY visits DESC
    LIMIT 48
  `).all<VisitorLocation>();

  return { total: Number(totalResult?.total ?? 0), locations: locationResult.results ?? [] };
}
