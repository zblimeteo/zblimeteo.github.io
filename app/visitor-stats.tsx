'use client';

import { useEffect, useMemo, useState } from 'react';
import { geoCentroid, geoNaturalEarth1, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import world from '@d3-maps/atlas/world/countries/countries-110m';
import type { VisitorLocation, VisitorSnapshot } from '../db/visitor-stats';
import { readBrowserCountry, knownAutomation } from '../db/visitor-geolocation';
import { readVisitorSnapshot, validSavedSnapshot, type SavedVisitorSnapshot } from '../db/visitor-client';
import { visitorIdentity } from '../db/visitor-identity';
import MapFrame from './map-frame';
import type * as GeoJSON from 'geojson';

type CountryFeature = GeoJSON.Feature<GeoJSON.Geometry, { id?: string; name?: string; name_long?: string }>;
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

function VisitorWorldMap({ locations }: { locations: VisitorLocation[] }) {
  const { projection, paths, plottedLocations } = useMemo(() => {
    const collection = feature(world as never, (world as never as { objects: { features: never } }).objects.features) as unknown as GeoJSON.FeatureCollection;
    const countries = (collection.features as CountryFeature[]).filter(country => country.properties.id !== 'ATA');
    const visibleCollection: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: countries };
    const mapProjection = geoNaturalEarth1().fitExtent([[18, 18], [942, 462]], visibleCollection);
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
  const [status, setStatus] = useState<'loading' | 'ready' | 'saved' | 'unavailable'>('loading');
  const [savedAt, setSavedAt] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let registrationTimer: ReturnType<typeof setTimeout> | undefined;
    let refreshing: Promise<void> | undefined;
    let registering: Promise<void> | undefined;
    let live = false;
    let saved: SavedVisitorSnapshot | undefined;
    const url = new URL(window.location.href);
    const endpoint = window.location.hostname === 'zblimeteo.github.io'
      ? 'https://zhi-bo-li-climate.zbli-meteo.chatgpt.site/api/visit' : '/api/visit';
    const ownerRequested = url.searchParams.get('owner') === '1';
    if (ownerRequested) storageSet('zb-owner-visitor-excluded','1');
    const preview = ['localhost','127.0.0.1'].includes(window.location.hostname) || window.location.hostname.endsWith('.chatgpt.site');
    const excluded = preview || ownerRequested || storageGet('zb-owner-visitor-excluded') === '1' || knownAutomation(navigator.userAgent, navigator.webdriver);

    function showSaved(value: unknown) {
      if (cancelled || live || !validSavedSnapshot(value)) return;
      if (saved && Date.parse(saved.capturedAt) >= Date.parse(value.capturedAt)) return;
      saved = value;
      setSnapshot(value.snapshot); setSavedAt(value.capturedAt); setStatus('saved');
    }
    function showLive(data: VisitorSnapshot) {
      if (cancelled) return;
      live = true;
      saved = { capturedAt: new Date().toISOString(), snapshot: data };
      storageSet('zb-visitor-snapshot', JSON.stringify(saved));
      setSnapshot(data); setSavedAt(saved.capturedAt); setStatus('ready');
    }
    function refresh() {
      if (refreshing || cancelled) return refreshing ?? Promise.resolve();
      clearTimeout(retryTimer);
      refreshing = readVisitorSnapshot(endpoint, controller.signal).then(showLive).catch(() => {
        if (cancelled) return;
        live = false;
        setStatus(saved ? 'saved' : 'unavailable');
        retryTimer = setTimeout(() => { void refresh(); }, 30000);
      }).finally(() => { refreshing = undefined; });
      return refreshing;
    }
    try { showSaved(JSON.parse(storageGet('zb-visitor-snapshot') ?? 'null')); } catch { /* Ignore invalid browser cache. */ }
    // A dated, real aggregate keeps the map useful if the cross-origin backend is unreachable.
    void fetch('/visitor-snapshot.json', { cache: 'no-cache', signal: AbortSignal.any([controller.signal, AbortSignal.timeout(8000)]) })
      .then(response => response.ok ? response.json() : null).then(showSaved).catch(() => {});
    function register() {
      if (excluded || cancelled) return Promise.resolve();
      if (registering) return registering;
      clearTimeout(registrationTimer);
      registering = (async () => {
        const visitorId = await visitorIdentity();
        if (cancelled || !visitorId) return;
        // Lifetime registration, rather than a daily counter. Existing profiles
        // confirm their ID once after this upgrade and never create another row.
        if (storageGet('zb-visitor-registered-id') === visitorId && storageGet('zb-visitor-country-status') === 'known') return;
        const origin = new URL(endpoint, window.location.href).origin;
        const countryCode = await readBrowserCountry(`${origin}/cdn-cgi/trace`, controller.signal);
        if (cancelled) return;
          // Reuse the same browser ID for every retry; INSERT OR IGNORE prevents duplicates.
          const data = await readVisitorSnapshot(endpoint, controller.signal, fetch, undefined, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ visitorId, path: window.location.pathname, countryCode, countrySource: 'site_edge_trace' }),
          });
          storageSet('zb-visit-recorded-at',String(Date.now()));
          storageSet('zb-visitor-registered-id', visitorId);
          storageSet('zb-visitor-country-status', countryCode ? 'known' : 'unknown');
          await refreshing;
          showLive(data);
          if (!countryCode) registrationTimer = setTimeout(() => { void register(); }, 60000);
      })().catch(() => {
        if (!cancelled) registrationTimer = setTimeout(() => { void register(); }, 30000);
      }).finally(() => { registering = undefined; });
      return registering;
    }
    const load = () => { void refresh(); void register(); };
    const online = () => load();
    const visible = () => { if (document.visibilityState === 'visible') load(); };
    window.addEventListener('online', online);
    document.addEventListener('visibilitychange', visible);
    load();
    return () => { cancelled = true; controller.abort(); clearTimeout(retryTimer); clearTimeout(registrationTimer); window.removeEventListener('online', online); document.removeEventListener('visibilitychange', visible); };
  }, [reloadKey]);

  return <section className="visitor-section" aria-labelledby="visitor-heading">
    <div className="map-heading visitor-heading"><p className="eyebrow" id="visitor-heading"><span /> Visitors</p><p className="visitor-count" aria-live="polite" title="Unique browser profiles; country is the first successfully recorded network exit."><strong>{status === 'ready' || status === 'saved' ? snapshot.total.toLocaleString('en-US') : '—'}</strong><span>Recorded visitors</span></p></div>
    <div className="visitor-layout">
      <VisitorWorldMap locations={snapshot.locations} />
      <aside className="visitor-breakdown" aria-label="Visitors by country">
        <p>Countries</p>
        <div className="visitor-country-scroll" tabIndex={0} role="region" aria-label="Country counts">
          {status === 'ready' || status === 'saved' ? <ul>{snapshot.locations.map(location => <li key={location.countryCode || 'unknown'}><span>{location.country}</span><strong>{location.visits}</strong></li>)}</ul> : <p className="visitor-status">{status === 'loading' ? 'Loading…' : 'Statistics temporarily unavailable'}</p>}
        </div>
      </aside>
    </div>
    {status === 'saved' || status === 'unavailable' ? <p className="visitor-note">{status === 'saved' ? `Last available count · ${new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(savedAt))} UTC` : 'Unable to connect to visitor statistics.'} <button className="visitor-retry" type="button" onClick={() => setReloadKey(key => key + 1)}>Retry</button></p> : null}
  </section>;
}
