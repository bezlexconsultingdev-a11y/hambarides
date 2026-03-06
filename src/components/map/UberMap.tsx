import { useCallback, useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useVehicleTracking } from './useVehicleTracking';
import { geocode } from './geocode';
import type { Driver, GeocodeFeature, VehicleState } from './types';
import carTopSvg from './assets/car-top.svg?url';

const SEARCH_DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

const INITIAL_CENTER: [number, number] = [-74.006, 40.7128];
const INITIAL_ZOOM = 16;
const INITIAL_PITCH = 60;
const INITIAL_BEARING = 30;
const VEHICLE_ICON_COLOR = '#22c55e';
const SHADOW_OFFSET: [number, number] = [2, 2];

const DEFAULT_DRIVER: Driver = {
  id: 'driver-1',
  name: 'Marcus Chen',
  carModel: 'Toyota Camry 2024',
  rating: 4.9,
};

interface VehicleFeatureCollection {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    geometry: { type: 'Point'; coordinates: [number, number] };
    properties: { bearing: number };
  }>;
}

function toGeoJSON(state: VehicleState): VehicleFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [state.lng, state.lat],
        },
        properties: { bearing: state.bearing },
      },
    ],
  };
}

export interface UberMapProps {
  /** Mapbox access token (required for map to load) */
  accessToken: string;
  /** Driver info for the profile card */
  driver?: Driver;
  /** When map is ready, call with updatePosition. Return a cleanup to run on unmount. */
  onReady?: (updatePosition: (lng: number, lat: number) => void) => void | (() => void);
  className?: string;
}

export function UberMap({ accessToken, driver = DEFAULT_DRIVER, onReady, className = '' }: UberMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const latestStateRef = useRef<VehicleState>({
    lng: INITIAL_CENTER[0],
    lat: INITIAL_CENTER[1],
    bearing: 0,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodeFeature[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onFrame = useCallback((state: VehicleState) => {
    latestStateRef.current = state;
    const map = mapRef.current;
    if (!map) return;
    const source = map.getSource('vehicle') as mapboxgl.GeoJSONSource | undefined;
    if (source) {
      source.setData(toGeoJSON(state));
    }
  }, []);

  const { updateTarget } = useVehicleTracking(
    { lng: INITIAL_CENTER[0], lat: INITIAL_CENTER[1] },
    { onFrame }
  );

  // Expose updatePosition for parent (e.g. demo timer or WebSocket); support cleanup
  useEffect(() => {
    const cleanup = onReady?.((lng: number, lat: number) => updateTarget({ lng, lat }));
    return () => { typeof cleanup === 'function' && cleanup(); };
  }, [onReady, updateTarget]);

  // Debounced geocode when user types
  useEffect(() => {
    if (searchQuery.length < MIN_QUERY_LENGTH) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    setSearchLoading(true);
    searchDebounceRef.current = setTimeout(() => {
      const proximity: [number, number] = [
        latestStateRef.current.lng,
        latestStateRef.current.lat,
      ];
      geocode(searchQuery, accessToken, { limit: 5, proximity })
        .then((res) => {
          setSearchResults(res.features as GeocodeFeature[]);
        })
        .catch(() => setSearchResults([]))
        .finally(() => setSearchLoading(false));
      searchDebounceRef.current = null;
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery, accessToken]);

  const handleSelectResult = useCallback(
    (feature: GeocodeFeature) => {
      const [lng, lat] = feature.center;
      const map = mapRef.current;
      if (map) {
        map.flyTo({
          center: [lng, lat],
          zoom: 15,
          pitch: INITIAL_PITCH,
          bearing: 0,
          duration: 1200,
          essential: true,
        });
        const source = map.getSource('search-result') as mapboxgl.GeoJSONSource | undefined;
        if (source) {
          source.setData({
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [lng, lat] },
                properties: {},
              },
            ],
          });
        }
      }
      setSearchOpen(false);
      setSearchQuery(feature.place_name);
      setSearchResults([]);
    },
    []
  );

  useEffect(() => {
    if (!containerRef.current || !accessToken) return;

    mapboxgl.accessToken = accessToken;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/standard',
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      pitch: INITIAL_PITCH,
      bearing: INITIAL_BEARING,
    });

    mapRef.current = map;

    map.on('style.load', () => {
      // Config API: night preset, hide non-essential POIs and transit labels
      map.setConfigProperty('basemap', 'lightPreset', 'night');
      map.setConfigProperty('basemap', 'showPointOfInterestLabels', false);
      map.setConfigProperty('basemap', 'showTransitLabels', false);

      // Vehicle point source (single point, properties.bearing for rotation)
      map.addSource('vehicle', {
        type: 'geojson',
        data: toGeoJSON(latestStateRef.current),
      });

      // Load car-top image with SDF for programmatic icon-color
      const img = new Image();
      img.onload = () => {
        if (!map.getStyle().sprite) return; // style may have been reset
        map.addImage('car-top', img, { sdf: true });

        // Shadow layer: same icon offset for "floating" effect
        map.addLayer({
          id: 'vehicle-shadow',
          type: 'symbol',
          source: 'vehicle',
          layout: {
            'icon-image': 'car-top',
            'icon-size': 1,
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
            'icon-offset': SHADOW_OFFSET,
            'icon-rotate': ['get', 'bearing'],
          },
          paint: {
            'icon-color': 'rgba(0, 0, 0, 0.45)',
          },
        });

        // Main vehicle layer (colorable via icon-color)
        map.addLayer({
          id: 'vehicle-icon',
          type: 'symbol',
          source: 'vehicle',
          layout: {
            'icon-image': 'car-top',
            'icon-size': 1,
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
            'icon-rotate': ['get', 'bearing'],
          },
          paint: {
            'icon-color': VEHICLE_ICON_COLOR,
          },
        });

        // Search result pin (single point, updated when user selects a place)
        map.addSource('search-result', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        });
        map.addLayer({
          id: 'search-result-pin',
          type: 'circle',
          source: 'search-result',
          paint: {
            'circle-radius': 10,
            'circle-color': '#3b82f6',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#fff',
          },
        });
      };
      img.crossOrigin = 'anonymous';
      img.src = carTopSvg;
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [accessToken]);

  const handleRecenter = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const { lng, lat } = latestStateRef.current;
    map.flyTo({
      center: [lng, lat],
      zoom: INITIAL_ZOOM,
      pitch: INITIAL_PITCH,
      bearing: INITIAL_BEARING,
      duration: 1200,
      essential: true,
    });
  }, []);

  return (
    <div className={`relative w-full h-full min-h-[400px] ${className}`}>
      <div ref={containerRef} className="absolute inset-0 w-full h-full rounded-lg" />

      {/* Search bar */}
      <div className="absolute top-4 left-1/2 z-10 w-full max-w-md -translate-x-1/2 px-2 sm:px-0">
        <div className="relative">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
            onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
            placeholder="Search for a place (e.g. Cape Town International Airport)"
            className="w-full rounded-xl border-0 bg-zinc-900/95 py-3 pl-4 pr-10 text-white placeholder-zinc-500 shadow-xl ring-1 ring-white/10 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="Search for a place"
            aria-expanded={searchOpen}
            aria-autocomplete="list"
          />
          {searchLoading && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" aria-hidden>
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </span>
          )}
          {searchOpen && searchResults.length > 0 && (
            <ul
              className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-auto rounded-xl bg-zinc-900/95 py-1 shadow-xl ring-1 ring-white/10 backdrop-blur-sm"
              role="listbox"
            >
              {searchResults.map((feature) => (
                <li
                  key={feature.id}
                  role="option"
                  tabIndex={0}
                  className="cursor-pointer px-4 py-2.5 text-left text-sm text-white hover:bg-white/10 focus:bg-white/10 focus:outline-none"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelectResult(feature);
                  }}
                >
                  <span className="font-medium">{feature.place_name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Recenter button */}
      <button
        type="button"
        onClick={handleRecenter}
        className="absolute bottom-6 right-6 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-zinc-800/90 text-white shadow-lg ring-1 ring-white/10 backdrop-blur-sm hover:bg-zinc-700/90 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        aria-label="Recenter on vehicle"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* Driver profile overlay */}
      <div className="absolute top-4 left-4 z-10 rounded-xl bg-zinc-900/90 px-4 py-3 shadow-xl ring-1 ring-white/10 backdrop-blur-sm">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Driver</p>
        <p className="mt-0.5 text-lg font-semibold text-white">{driver.name}</p>
        <p className="text-sm text-zinc-300">{driver.carModel}</p>
        {driver.rating != null && (
          <p className="mt-1 text-sm text-amber-400">
            ★ {driver.rating.toFixed(1)}
          </p>
        )}
      </div>
    </div>
  );
}
