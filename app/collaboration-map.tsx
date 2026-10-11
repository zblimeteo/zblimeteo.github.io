'use client';

import { useMemo, useState } from 'react';
import MapFrame from './map-frame';
import type * as GeoJSON from 'geojson';
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
  const countries = useMemo(() => {
    const collection = feature(world as never, (world as never as { objects: { features: never } }).objects.features);
    return (collection as unknown as GeoJSON.FeatureCollection).features as CountryFeature[];
  }, []);
  const paths = useMemo(() => {
    const collection: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: countries };
    const projection = geoNaturalEarth1().fitExtent([[14, 18], [946, 462]], collection);
    const path = geoPath(projection);
    return countries.map((country) => ({ country, d: path(country) ?? '' }));
  }, [countries]);
  const active = collaborationData[activeId];

  return (
    <div className="network-map-wrap">
      <MapFrame label="Academic network map">
        <path className="map-sphere" vectorEffect="non-scaling-stroke" d={geoPath(geoNaturalEarth1().fitExtent([[14, 18], [946, 462]], { type: 'Sphere' }))({ type: 'Sphere' }) ?? ''} />
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
      </MapFrame>
      <div className="map-detail" aria-live="polite">
        <small>{active.level}</small>
        <strong>{active.country}</strong>
        <span>Relative collaboration strength</span>
        <p>{active.institutions}</p>
      </div>
    </div>
  );
}
