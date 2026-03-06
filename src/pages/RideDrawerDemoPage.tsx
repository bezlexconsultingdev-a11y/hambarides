import { useState } from 'react';
import RideSelectionDrawer from '../components/RideSelectionDrawer';

export default function RideDrawerDemoPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [lastConfirm, setLastConfirm] = useState<{ rideId: string; price: number } | null>(null);

  return (
    <div className="min-h-screen bg-neutral-100 p-4 dark:bg-neutral-950 md:p-8">
      <div className="mx-auto max-w-md">
        <h1 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-white">
          Ride Selection Drawer
        </h1>
        <p className="mb-6 text-neutral-600 dark:text-neutral-400">
          Mobile-responsive drawer that slides up from the bottom. Resize the window to test.
        </p>

        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="w-full rounded-xl bg-blue-600 py-4 text-lg font-semibold text-white shadow-md transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-950"
        >
          Open ride options
        </button>

        {lastConfirm && (
          <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
            Last confirmed: <strong>{lastConfirm.rideId}</strong> — ${lastConfirm.price.toFixed(2)}
          </p>
        )}
      </div>

      <RideSelectionDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onConfirm={(rideId, price) => {
          setLastConfirm({ rideId, price });
          setDrawerOpen(false);
        }}
      />
    </div>
  );
}
