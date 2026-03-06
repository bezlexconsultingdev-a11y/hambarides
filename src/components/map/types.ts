/**
 * Geographic coordinates [longitude, latitude]
 */
export interface Coordinates {
  lng: number;
  lat: number;
}

/**
 * GPS ping payload as received from the tracking source
 */
export interface GpsPing {
  lng: number;
  lat: number;
  timestamp?: number;
}

/**
 * Driver profile displayed in the overlay card
 */
export interface Driver {
  id: string;
  name: string;
  carModel: string;
  rating?: number;
}

/**
 * Interpolated vehicle state used for smooth rendering (position + rotation)
 */
export interface VehicleState {
  lng: number;
  lat: number;
  bearing: number; // degrees, 0 = north, clockwise
}

/**
 * Map instance and related state (for refs / imperative handle)
 */
export interface MapState {
  isReady: boolean;
  center: Coordinates;
  zoom: number;
  pitch: number;
  bearing: number;
}

/**
 * Single result from Mapbox Geocoding API (forward geocode)
 */
export interface GeocodeFeature {
  id: string;
  place_name: string;
  center: [number, number];
  geometry: { type: 'Point'; coordinates: [number, number] };
  relevance?: number;
}

export interface GeocodeResponse {
  type: 'FeatureCollection';
  query: string[];
  features: GeocodeFeature[];
}
