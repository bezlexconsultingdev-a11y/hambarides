import { useCallback, useEffect, useRef, useState } from 'react';
import bearing from '@turf/bearing';
import type { GpsPing, VehicleState } from './types';

const DEFAULT_DURATION_MS = 1000;

export interface UseVehicleTrackingOptions {
  /** Called every frame with interpolated state (e.g. to update map source without re-renders) */
  onFrame?: (state: VehicleState) => void;
}

/**
 * Interpolates between two vehicle states over a given duration using requestAnimationFrame.
 * When new coordinates arrive, animates from current position to target over 1000ms; no teleporting.
 * Bearing is computed with Turf so the car faces the direction of travel.
 */
export function useVehicleTracking(
  initialPosition: { lng: number; lat: number } = { lng: -74.006, lat: 40.7128 },
  options: UseVehicleTrackingOptions = {}
) {
  const { onFrame } = options;
  const [state, setState] = useState<VehicleState>({
    lng: initialPosition.lng,
    lat: initialPosition.lat,
    bearing: 0,
  });

  const targetRef = useRef<VehicleState>({ ...state });
  const startRef = useRef<VehicleState>({ ...state });
  const rafIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const durationMsRef = useRef(DEFAULT_DURATION_MS);
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;

  const updateTarget = useCallback((ping: GpsPing) => {
    const prev = startRef.current;
    const newBearing = bearing([prev.lng, prev.lat], [ping.lng, ping.lat]);
    targetRef.current = {
      lng: ping.lng,
      lat: ping.lat,
      bearing: newBearing,
    };
    startRef.current = {
      lng: prev.lng,
      lat: prev.lat,
      bearing: prev.bearing,
    };
    startTimeRef.current = performance.now();
    durationMsRef.current = DEFAULT_DURATION_MS;

    const tick = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const t = Math.min(elapsed / durationMsRef.current, 1);
      const easeT = easeInOutCubic(t);

      const start = startRef.current;
      const target = targetRef.current;

      const nextState: VehicleState = {
        lng: start.lng + (target.lng - start.lng) * easeT,
        lat: start.lat + (target.lat - start.lat) * easeT,
        bearing: start.bearing + (target.bearing - start.bearing) * easeT,
      };

      onFrameRef.current?.(nextState);
      setState(nextState);

      if (t < 1) {
        rafIdRef.current = requestAnimationFrame(tick);
      } else {
        startRef.current = { ...target };
        rafIdRef.current = null;
      }
    };

    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }
    rafIdRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return { state, updateTarget } as const;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
