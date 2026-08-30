import type { D1Database } from '@cloudflare/workers-types';
import { createUniqueVisitorsTable, createVisitorEventsDateIndex, createVisitorEventsTable } from './schema';

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
    db.prepare(createUniqueVisitorsTable),
  ]);
}

export async function recordVisit(db: D1Database, visit: Omit<VisitorLocation, 'visits'> & { path: string; visitorKey: string }) {
  await db.prepare(`
    INSERT OR IGNORE INTO unique_visitors_v2
      (visitor_key, country_code, country, city, latitude, longitude, path)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    visit.visitorKey,
    visit.countryCode || null,
    visit.country || null,
    visit.city || null,
    typeof visit.latitude === 'number' && Number.isFinite(visit.latitude) ? visit.latitude : null,
    typeof visit.longitude === 'number' && Number.isFinite(visit.longitude) ? visit.longitude : null,
    visit.path,
  ).run();
}

export async function getVisitorSnapshot(db: D1Database): Promise<VisitorSnapshot> {
  const totalResult = await db.prepare('SELECT COUNT(*) AS total FROM unique_visitors_v2').first<{ total: number }>();
  const locationResult = await db.prepare(`
    SELECT
      country_code AS countryCode,
      COALESCE(country, country_code) AS country,
      '' AS city,
      ROUND(AVG(latitude), 1) AS latitude,
      ROUND(AVG(longitude), 1) AS longitude,
      COUNT(*) AS visits
    FROM unique_visitors_v2
    WHERE country_code IS NOT NULL AND country_code != ''
    GROUP BY country_code, country
    ORDER BY visits DESC
    LIMIT 48
  `).all<VisitorLocation>();

  return { total: Number(totalResult?.total ?? 0), locations: locationResult.results ?? [] };
}
