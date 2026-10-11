'use client';

import { useEffect, useMemo, useState } from 'react';
import { geoCentroid, geoNaturalEarth1, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import world from '@d3-maps/atlas/world/countries/countries-110m';
import type { VisitorLocation, VisitorSnapshot } from '../db/visitor-stats';
import { traceCountry } from '../db/visitor-geolocation';
import MapFrame from './map-frame';
import type * as GeoJSON from 'geojson';

type CountryFeature = GeoJSON.Feature<GeoJSON.Geometry, { name?: string; name_long?: string }>;
const emptySnapshot: VisitorSnapshot = { total: 0, locations: [] };

function storageGet(key: string) {
  try { const value = window.localStorage.getItem(key); if (value !== null) return value; } catch { /* Try browser alternatives. */ }
  try { const value = window.sessionStorage.getItem(key); if (value !== null) return value; } catch { /* Cookies may still be available. */ }
  try { return document.cookie.split('; ').find(part => part.startsWith(`${key}=`))?.slice(key.length + 1) ?? null; } catch { return null; }
}
function storageSet(key: string, value: string) {
  try { window.localStorage.setItem(key, value); } catch { /* Continue even with restricted storage. */ }
  try { window.sessionStorage.setItem(key, value); } catch { /* Cookies are an additional fallback. */ }
  try { document.cookie = `${key}=${value}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`; } catch { /* Never interrupt visitor counts. */ }
}

async function browserCountry(apiEndpoint: string) {
  try {
    // This is the existing visitor backend origin, not a new geolocation provider.
    const visitorOrigin = new URL(apiEndpoint, window.location.href).origin;
    const response = await fetch(`${visitorOrigin}/cdn-cgi/trace`, { credentials: 'omit', cache: 'no-store', signal: AbortSignal.timeout(4500) });
    return response.ok ? traceCountry(await response.text()) : '';
  } catch { return ''; }
}

function VisitorWorldMap({ locations }: { locations: VisitorLocation[] }) {
  const { projection, paths, plottedLocations } = useMemo(() => {
    const collection = feature(world as never, (world as never as { objects: { features: never } }).objects.features) as unknown as GeoJSON.FeatureCollection;
    const countries = collection.features as CountryFeature[];
    const mapProjection = geoNaturalEarth1().fitExtent([[18, 18], [942, 462]], collection);
    const path = geoPath(mapProjection);
    const centers = new Map<string, [number, number]>();
    countries.forEach(country => {
      const center = geoCentroid(country) as [number, number];
      [country.properties?.name, country.properties?.name_long].filter(Boolean).forEach(name => centers.set(name!.toLowerCase(), center));
    });
    const aliases: Record<string, string> = { 'united states': 'united states of america', 'czechia': 'czech republic' };
    const resolved = locations.flatMap(location => {
      const name = location.country.toLowerCase();
      const center = centers.get(name) ?? centers.get(aliases[name]);
      return center ? [{ ...location, center }] : [];
    });
    return { projection: mapProjection, paths: countries.map(country => path(country) ?? ''), plottedLocations: resolved };
  }, [locations]);

  return <MapFrame label="Visitor countries map">
    <rect width="960" height="480" className="visitor-map-water" />
    {paths.map((path, index) => <path key={index} d={path} vectorEffect="non-scaling-stroke" className="visitor-map-land" />)}
    {plottedLocations.map(location => {
      const point = projection(location.center);
      if (!point) return null;
      const [x,y] = point;
      return <g key={location.countryCode} className="visitor-map-marker">
        <circle cx={x} cy={y} r={Math.min(8, 3 + Math.log1p(location.visits) * 1.5)} vectorEffect="non-scaling-stroke" className="visitor-map-dot"><title>{location.country} · {location.visits} visitors</title></circle>
        <text x={x+10} y={y+4}>{location.visits}</text>
      </g>;
    })}
  </MapFrame>;
}

export default function VisitorStats() {
  const [snapshot, setSnapshot] = useState<VisitorSnapshot>(emptySnapshot);
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');

  useEffect(() => {
    let cancelled = false;
    const url = new URL(window.location.href);
    const endpoint = window.location.hostname === 'zblimeteo.github.io'
      ? 'https://zhi-bo-li-climate.zbli-meteo.chatgpt.site/api/visit' : '/api/visit';
    const ownerRequested = url.searchParams.get('owner') === '1';
    if (ownerRequested) storageSet('zb-owner-visitor-excluded','1');
    const preview = ['localhost','127.0.0.1'].includes(window.location.hostname) || window.location.hostname.endsWith('.chatgpt.site');
    const excluded = preview || ownerRequested || storageGet('zb-owner-visitor-excluded') === '1';
    const recordedAt = Number(storageGet('zb-visit-recorded-at') ?? 0);
    const recent = recordedAt > 0 && Date.now() - recordedAt < 86400000;

    async function getSnapshot() {
      const response = await fetch(endpoint, { mode: 'cors', credentials: 'omit', cache: 'no-store', signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error('Visitor statistics unavailable');
      const data = await response.json() as VisitorSnapshot;
      if (!cancelled) { setSnapshot(data); setStatus('ready'); }
    }
    async function load() {
      const reading = getSnapshot().catch(() => { if (!cancelled) setStatus('unavailable'); });
      if (!excluded && !recent) {
        let visitorId = storageGet('zb-visitor-id');
        if (!visitorId) { visitorId = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`; storageSet('zb-visitor-id',visitorId); }
        const countryCode = await browserCountry(endpoint);
        try {
          const response = await fetch(endpoint, {
            method: 'POST', mode: 'cors', credentials: 'omit', cache: 'no-store', signal: AbortSignal.timeout(10000),
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ visitorId, path: window.location.pathname, countryCode, countrySource: 'site_edge_trace' }),
          });
          if (!response.ok) throw new Error('Visit recording unavailable');
          const data = await response.json() as VisitorSnapshot;
          storageSet('zb-visit-recorded-at',String(Date.now()));
          await reading;
          if (!cancelled) { setSnapshot(data); setStatus('ready'); }
        } catch { await reading; }
      } else await reading;
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  return <section className="visitor-section" aria-labelledby="visitor-heading">
    <div className="map-heading visitor-heading"><p className="eyebrow" id="visitor-heading"><span /> Visitors</p><p className="visitor-count"><strong>{status === 'ready' ? snapshot.total.toLocaleString('en-US') : '—'}</strong><span>Recorded visitors</span></p></div>
    <div className="visitor-layout">
      <VisitorWorldMap locations={snapshot.locations} />
      <aside className="visitor-breakdown" aria-label="Visitors by country" tabIndex={0}>
        <p>Countries</p>
        {status === 'ready' ? <ul>{snapshot.locations.map(location => <li key={location.countryCode || 'unknown'}><span>{location.country}</span><strong>{location.visits}</strong></li>)}</ul> : <p className="visitor-status">{status === 'loading' ? 'Loading…' : 'Statistics temporarily unavailable'}</p>}
      </aside>
    </div>
    <p className="visitor-note">Approximate IP-based countries · One record per browser · VPNs may affect location</p>
  </section>;
}
