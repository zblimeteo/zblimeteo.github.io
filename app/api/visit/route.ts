import { env } from 'cloudflare:workers';
import type { D1Database } from '@cloudflare/workers-types';
import { getVisitorSnapshot, recordVisit } from '../../../db/visitor-stats';
import { countryName, resolveVisitorCountry, knownAutomation } from '../../../db/visitor-geolocation';

type GeoRequest = Request & {
  cf?: { country?: string; city?: string; latitude?: string; longitude?: string };
};

const corsHeaders = {
  'access-control-allow-origin': 'https://zblimeteo.github.io',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
  'cache-control': 'no-store',
  vary: 'Origin',
};

const publicSiteOrigin = 'https://zblimeteo.github.io';

function json(data: unknown) {
  return Response.json(data, { headers: corsHeaders });
}

function database() {
  return (env as unknown as { DB: D1Database }).DB;
}

export async function GET() {
  const db = database();
  return json(await getVisitorSnapshot(db));
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: GeoRequest) {
  const db = database();
  if (request.headers.get('origin') !== publicSiteOrigin || knownAutomation(request.headers.get('user-agent') ?? '')) {
    return json(await getVisitorSnapshot(db));
  }
  const hostname = new URL(request.url).hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return json(await getVisitorSnapshot(db));
  }
  const body = await request.json().catch(() => ({})) as { path?: string; visitorId?: string; countryCode?: string; countrySource?: string };
  const visitorKey = typeof body.visitorId === 'string' && /^[a-zA-Z0-9-]{16,80}$/.test(body.visitorId)
    ? body.visitorId
    : '';
  if (!visitorKey) return json(await getVisitorSnapshot(db));
  // Resolve the browser's network country before the Sites forwarding layer.
  // A failed direct lookup stays unknown rather than inheriting a proxy country.
  const { countryCode, countrySource } = resolveVisitorCountry(body, request.cf?.country);
  await recordVisit(db, {
    countryCode,
    country: countryCode ? countryName(countryCode) : '',
    countrySource,
    city: '',
    latitude: Number.NaN,
    longitude: Number.NaN,
    path: typeof body.path === 'string' ? body.path.slice(0, 160) : '/',
    visitorKey,
  });
  return json(await getVisitorSnapshot(db));
}
