import { useRef } from 'react';
import { UberMap } from '../components/map';

/** Demo waypoints: short loop near initial center for smooth movement demo. */
const DEMO_WAYPOINTS: Array<[number, number]> = [
  [-74.006, 40.7128],
  [-74.004, 40.7132],
  [-74.002, 40.7128],
  [-74.004, 40.7122],
  [-74.006, 40.7128],
];

export default function MapDemoPage() {
  const waypointIndexRef = useRef(0);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Live driver map</h1>
        <p className="text-sm text-zinc-400">
          Vehicle animates over 1s between pings. Use Recenter to follow.
        </p>
      </div>
      <div className="flex-1 overflow-hidden rounded-xl">
        <UberMap
          accessToken={import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ?? ''}
          onReady={(updatePosition) => {
            waypointIndexRef.current = 0;
            const interval = setInterval(() => {
              const idx = waypointIndexRef.current % DEMO_WAYPOINTS.length;
              const [lng, lat] = DEMO_WAYPOINTS[idx];
              updatePosition(lng, lat);
              waypointIndexRef.current = idx + 1;
            }, 1500);
            return () => clearInterval(interval);
          }}
        />
      </div>
    </div>
  );
}
