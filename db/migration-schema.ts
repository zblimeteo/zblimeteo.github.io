import { sql } from 'drizzle-orm';
import { sqliteTable, text, real } from 'drizzle-orm/sqlite-core';

export const uniqueVisitors = sqliteTable('unique_visitors_v3', {
  visitorKey: text('visitor_key').primaryKey(),
  visitedAt: text('visited_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  countryCode: text('country_code'),
  country: text('country'),
  city: text('city'),
  latitude: real('latitude'),
  longitude: real('longitude'),
  path: text('path').notNull(),
});

export const visitorCountrySources = sqliteTable('visitor_country_sources', {
  visitorKey: text('visitor_key').primaryKey().references(() => uniqueVisitors.visitorKey),
  source: text('source').notNull(),
  recordedAt: text('recorded_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});
