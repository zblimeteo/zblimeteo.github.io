'use client';

import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from 'react';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import world from '@d3-maps/atlas/world/countries/countries-110m';

type CountryFeature = GeoJSON.Feature<GeoJSON.Geometry, { id: string; name: string; name_long: string }>;

const collaborationData: Record<string, { country: string; weight: number; level: string; institutions: string }> = {
  CHN: { country: 'China', weight: 48, level: 'Core network', institutions: 'Peking University · CAS · NUIST · Tsinghua University' },
  TWN: { country: 'China', weight: 48, level: 'Core network', institutions: 'Part of the China collaboration network' },
  SWE: { country: 'Sweden', weight: 17, level: 'Strong network', institutions: 'University of Gothenburg · Uppsala University' },
  USA: { country: 'United States', weight: 7, level: 'Established network', institutions: 'Multiple university collaborators' },
  KOR: { country: 'South Korea', weight: 4, level: 'Growing network', institutions: 'Climate and atmospheric science collaborators' },
  ESP: { country: 'Spain', weight: 3, level: 'Growing network', institutions: 'CSIC and wind-climate collaborators' },
  DEU: { country: 'Germany', weight: 3, level: 'Growing network', institutions: 'Climate dynamics collaborators' },
  NLD: { country: 'Netherlands', weight: 2, level: 'Emerging network', institutions: 'Climate and sea-level collaborators' },
  CAN: { country: 'Canada', weight: 2, level: 'Emerging network', institutions: 'Cyclone and paleoclimate collaborators' },
  ISR: { country: 'Israel', weight: 1, level: 'Emerging network', institutions: 'Atmospheric dynamics collaboration' },
  GBR: { country: 'United Kingdom', weight: 1, level: 'Emerging network', institutions: 'Climate research collaboration' },
};

function countryColor(weight?: number) {
  if (!weight) return '#d8d4c9';
  const strength = Math.log1p(weight) / Math.log1p(48);
  const light = [247, 215, 202];
  const dark = [145, 27, 24];
  const rgb = light.map((value, index) => Math.round(value + (dark[index] - value) * strength));
  return `rgb(${rgb.join(',')})`;
}

export default function CollaborationMap() {
  const [activeId, setActiveId] = useState('CHN');
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number } | null>(null);
  const countries = useMemo(() => {
    const collection = feature(world as never, (world as never as { objects: { features: never } }).objects.features);
    return (collection as unknown as GeoJSON.FeatureCollection).features as CountryFeature[];
  }, []);
  const paths = useMemo(() => {
    const collection: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: countries };
    const projection = geoNaturalEarth1().fitExtent([[14, 18], [946, 476]], collection);
    const path = geoPath(projection);
    return countries.map((country) => ({ country, d: path(country) ?? '' }));
  }, [countries]);
  const active = collaborationData[activeId];

  const clampView = (scale: number, x: number, y: number) => ({
    scale,
    x: Math.min(0, Math.max(960 * (1 - scale), x)),
    y: Math.min(0, Math.max(500 * (1 - scale), y)),
  });

  const zoomTo = (nextScale: number, anchorX = 480, anchorY = 250) => {
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
    const anchorX = ((event.clientX - rect.left) / rect.width) * 960;
    const anchorY = ((event.clientY - rect.top) / rect.height) * 500;
    zoomTo(view.scale * (event.deltaY < 0 ? 1.22 : 0.82), anchorX, anchorY);
  };

  const handlePointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: view.x, originY: view.y };
    setDragging(true);
  };

  const handlePointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!drag.current || drag.current.pointerId !== event.pointerId || view.scale === 1) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = drag.current.originX + ((event.clientX - drag.current.startX) / rect.width) * 960;
    const y = drag.current.originY + ((event.clientY - drag.current.startY) / rect.height) * 500;
    setView(clampView(view.scale, x, y));
  };

  const stopDragging = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (drag.current?.pointerId === event.pointerId) drag.current = null;
    setDragging(false);
  };

  return (
    <div className="network-map-wrap">
      <div className="map-controls" aria-label="Academic network map controls">
        <button type="button" onClick={() => zoomTo(view.scale * 1.35)} aria-label="Zoom in">+</button>
        <button type="button" onClick={() => zoomTo(view.scale / 1.35)} aria-label="Zoom out">−</button>
        <button type="button" className="map-reset" onClick={() => setView({ scale: 1, x: 0, y: 0 })}>Reset</button>
      </div>
      <svg
        className={`network-map ${dragging ? 'is-dragging' : ''}`}
        viewBox="0 0 960 500"
        role="img"
        aria-labelledby="network-map-title network-map-desc"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
      >
        <title id="network-map-title">World map of Zhi-Bo Li&apos;s academic collaborations</title>
        <desc id="network-map-desc">Interactive world map. Use the controls or mouse wheel to zoom, then drag to move around the map.</desc>
        <g transform={`translate(${view.x} ${view.y}) scale(${view.scale})`}>
          <path className="map-sphere" vectorEffect="non-scaling-stroke" d={geoPath(geoNaturalEarth1().fitExtent([[14, 18], [946, 476]], { type: 'Sphere' }))({ type: 'Sphere' }) ?? ''} />
          {paths.map(({ country, d }) => {
            const id = country.properties.id;
            const data = collaborationData[id];
            return (
              <path
                key={id}
                d={d}
                className={`map-country ${activeId === id ? 'is-active' : ''}`}
                fill={countryColor(data?.weight)}
                vectorEffect="non-scaling-stroke"
                onMouseEnter={() => data && setActiveId(id)}
                onFocus={() => data && setActiveId(id)}
                tabIndex={data ? 0 : -1}
                aria-label={data ? `${data.country}: ${data.level}` : country.properties.name_long}
              />
            );
          })}
        </g>
      </svg>
      <div className="map-detail" aria-live="polite">
        <small>{active.level}</small>
        <strong>{active.country}</strong>
        <span>Relative collaboration strength</span>
        <p>{active.institutions}</p>
      </div>
    </div>
  );
}
