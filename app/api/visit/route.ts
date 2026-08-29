import { env } from 'cloudflare:workers';
import type { D1Database } from '@cloudflare/workers-types';
import { ensureVisitorSchema, getVisitorSnapshot, recordVisit } from '../../../db/visitor-stats';

type GeoRequest = Request & {
  cf?: { country?: string; city?: string; latitude?: string; longitude?: string };
};

const corsHeaders = {
  'access-control-allow-origin': 'https://zblimeteo.github.io',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
  vary: 'Origin',
};

function json(data: unknown) {
  return Response.json(data, { headers: corsHeaders });
}

function countryName(code: string) {
  if (!code) return '';
  try { return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) ?? code; } catch { return code; }
}

function database() {
  return (env as unknown as { DB: D1Database }).DB;
}

export async function GET() {
  const db = database();
  await ensureVisitorSchema(db);
  return json(await getVisitorSnapshot(db));
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: GeoRequest) {
  const db = database();
  await ensureVisitorSchema(db);
  const hostname = new URL(request.url).hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return json(await getVisitorSnapshot(db));
  }
  const body = await request.json().catch(() => ({})) as { path?: string };
  const countryCode = request.cf?.country ?? request.headers.get('cf-ipcountry') ?? '';
  const latitude = Number(request.cf?.latitude ?? Number.NaN);
  const longitude = Number(request.cf?.longitude ?? Number.NaN);
  await recordVisit(db, {
    countryCode,
    country: countryName(countryCode),
    city: request.cf?.city ?? '',
    latitude,
    longitude,
    path: typeof body.path === 'string' ? body.path.slice(0, 160) : '/',
  });
  return json(await getVisitorSnapshot(db));
}
