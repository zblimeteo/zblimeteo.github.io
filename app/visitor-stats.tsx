'use client';

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from 'react';
import { geoCentroid, geoNaturalEarth1, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import world from '@d3-maps/atlas/world/countries/countries-110m';
import type { VisitorLocation, VisitorSnapshot } from '../db/visitor-stats';

type CountryFeature = GeoJSON.Feature<GeoJSON.Geometry, { name?: string; name_long?: string }>;

const emptySnapshot: VisitorSnapshot = { total: 0, locations: [] };

function VisitorWorldMap({ countries, locations }: { countries: CountryFeature[]; locations: VisitorLocation[] }) {
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number } | null>(null);
  const { projection, paths, plottedLocations } = useMemo(() => {
    const collection: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: countries };
    const mapProjection = geoNaturalEarth1().fitExtent([[18, 18], [942, 462]], collection);
    const path = geoPath(mapProjection);
    const centroids = new Map<string, [number, number]>();
    countries.forEach((country) => {
      const center = geoCentroid(country) as [number, number];
      const names = [country.properties?.name, country.properties?.name_long].filter(Boolean) as string[];
      names.forEach((name) => centroids.set(name.toLowerCase(), center));
    });
    const resolved = locations.map((location) => {
      const stored = typeof location.longitude === 'number' && typeof location.latitude === 'number'
        ? [location.longitude, location.latitude] as [number, number]
        : null;
      const center = stored ?? centroids.get(location.country.toLowerCase()) ?? null;
      return center ? { ...location, center } : null;
    }).filter(Boolean) as Array<VisitorLocation & { center: [number, number] }>;
    return { projection: mapProjection, paths: countries.map((country) => path(country) ?? ''), plottedLocations: resolved };
  }, [countries, locations]);

  const clampView = (scale: number, x: number, y: number) => ({
    scale,
    x: Math.min(0, Math.max(960 * (1 - scale), x)),
    y: Math.min(0, Math.max(480 * (1 - scale), y)),
  });

  const zoomTo = (nextScale: number, anchorX = 480, anchorY = 240) => {
    setView((current) => {
      const scale = Math.min(5, Math.max(1, nextScale));
      if (scale === 1) return { scale: 1, x: 0, y: 0 };
      const factor = scale / current.scale;
      return clampView(scale, anchorX - (anchorX - current.x) * factor, anchorY - (anchorY - current.y) * factor);
    });
  };

  const handleWheel = (event: ReactWheelEvent<SVGSVGElement>) => {
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    zoomTo(
      view.scale * (event.deltaY < 0 ? 1.22 : 0.82),
      ((event.clientX - rect.left) / rect.width) * 960,
      ((event.clientY - rect.top) / rect.height) * 480,
    );
  };

  const handlePointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: view.x, originY: view.y };
    setDragging(true);
  };

  const handlePointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!drag.current || drag.current.pointerId !== event.pointerId || view.scale === 1) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setView(clampView(
      view.scale,
      drag.current.originX + ((event.clientX - drag.current.startX) / rect.width) * 960,
      drag.current.originY + ((event.clientY - drag.current.startY) / rect.height) * 480,
    ));
  };

  const stopDragging = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (drag.current?.pointerId === event.pointerId) drag.current = null;
    setDragging(false);
  };

  return (
    <figure className="visitor-map-card">
      <figcaption>Visitor locations</figcaption>
      <div className="visitor-map-shell">
        <div className="map-controls visitor-map-controls" aria-label="Visitor map controls">
          <button type="button" onClick={() => zoomTo(view.scale * 1.35)} aria-label="Zoom in">+</button>
          <button type="button" onClick={() => zoomTo(view.scale / 1.35)} aria-label="Zoom out">−</button>
          <button type="button" className="map-reset" onClick={() => setView({ scale: 1, x: 0, y: 0 })}>Reset</button>
        </div>
        <svg
          className={dragging ? 'is-dragging' : ''}
          viewBox="0 0 960 480"
          role="img"
          aria-label="Interactive world map of approximate visitor locations"
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDragging}
          onPointerCancel={stopDragging}
        >
          <rect width="960" height="480" className="visitor-map-water" />
          <g transform={`translate(${view.x} ${view.y}) scale(${view.scale})`}>
            {paths.map((path, index) => <path key={index} d={path} vectorEffect="non-scaling-stroke" className="visitor-map-land" />)}
            {plottedLocations.map((location, index) => {
              const point = projection(location.center);
              if (!point) return null;
              const [x, y] = point;
              return (
                <g key={`${location.countryCode}-${index}`} className="visitor-map-marker">
                  <circle
                    cx={x}
                    cy={y}
                    r={Math.min(6, 2.2 + Math.log1p(location.visits) * 1.35)}
                    vectorEffect="non-scaling-stroke"
                    className="visitor-map-dot"
                  >
                    <title>{location.country} · {location.visits} visits</title>
                  </circle>
                  <text x={x + 8} y={y + 4} vectorEffect="non-scaling-stroke">{location.visits}</text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </figure>
  );
}

export default function VisitorStats() {
  const [snapshot, setSnapshot] = useState<VisitorSnapshot>(emptySnapshot);
  const [ready, setReady] = useState(false);
  const countries = useMemo(() => {
    const collection = feature(world as never, (world as never as { objects: { features: never } }).objects.features);
    return (collection as unknown as GeoJSON.FeatureCollection).features as CountryFeature[];
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    const apiEndpoint = window.location.hostname === 'zblimeteo.github.io'
      ? 'https://zhi-bo-li-climate.zbli-meteo.chatgpt.site/api/visit'
      : '/api/visit';
    const ownerRequested = url.searchParams.get('owner') === '1';
    if (ownerRequested) {
      window.localStorage.setItem('zb-owner-visitor-excluded', '1');
      url.searchParams.delete('owner');
      window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    }
    const localPreview = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const ownerExcluded = ownerRequested || window.localStorage.getItem('zb-owner-visitor-excluded') === '1';
    const lastRecordedAt = Number(window.localStorage.getItem('zb-visit-recorded-at') ?? 0);
    const recordedRecently = Number.isFinite(lastRecordedAt) && Date.now() - lastRecordedAt < 24 * 60 * 60 * 1000;
    const alreadyRecorded = localPreview || ownerExcluded || recordedRecently;
    let visitorId = window.localStorage.getItem('zb-visitor-id');
    if (!visitorId) {
      visitorId = typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
      window.localStorage.setItem('zb-visitor-id', visitorId);
    }
    fetch(apiEndpoint, {
      method: alreadyRecorded ? 'GET' : 'POST',
      mode: 'cors',
      credentials: 'omit',
      headers: alreadyRecorded ? undefined : { 'content-type': 'application/json' },
      body: alreadyRecorded ? undefined : JSON.stringify({ path: window.location.pathname, visitorId }),
    })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data: VisitorSnapshot) => {
        if (!alreadyRecorded) window.localStorage.setItem('zb-visit-recorded-at', String(Date.now()));
        setSnapshot(data);
        setReady(true);
      })
      .catch(() => setReady(true));
  }, []);

  return (
    <section className="visitor-section" aria-labelledby="visitor-heading">
      <div className="visitor-heading">
        <div><p className="eyebrow"><span /> Visitors</p><h2 id="visitor-heading">A growing global readership.</h2></div>
        <p className="visitor-count"><strong>{ready ? snapshot.total.toLocaleString('en-US') : '—'}</strong><span>Recorded visits</span></p>
      </div>
      {ready && snapshot.locations.length > 0 ? <p className="visitor-breakdown">
        {snapshot.locations.map((location) => `${location.country} ${location.visits}`).join(' · ')}
      </p> : null}
      <div className="visitor-maps">
        <VisitorWorldMap countries={countries} locations={snapshot.locations} />
      </div>
    </section>
  );
}
