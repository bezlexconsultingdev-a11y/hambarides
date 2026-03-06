import type { GeocodeResponse } from './types';

const GEOCODE_BASE = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

/**
 * Forward geocode: search text → coordinates.
 * Must be triggered by user activity per Mapbox ToS.
 */
export async function geocode(
  query: string,
  accessToken: string,
  options?: { limit?: number; proximity?: [number, number] }
): Promise<GeocodeResponse> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { type: 'FeatureCollection', query: [], features: [] };
  }
  const params = new URLSearchParams({
    access_token: accessToken,
    limit: String(options?.limit ?? 5),
  });
  if (options?.proximity) {
    params.set('proximity', `${options.proximity[0]},${options.proximity[1]}`);
  }
  const url = `${GEOCODE_BASE}/${encodeURIComponent(trimmed)}.json?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Geocoding failed: ${res.status}`);
  }
  const data = (await res.json()) as GeocodeResponse;
  return data;
}
