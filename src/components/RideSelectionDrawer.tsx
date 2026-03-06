import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const RIDE_OPTIONS = [
  {
    id: 'standard',
    label: 'Standard',
    description: 'Everyday ride at a great price. Fits up to 4 passengers.',
    price: 12.5,
    eta: '5 mins',
    icon: 'standard',
  },
  {
    id: 'premium',
    label: 'Premium',
    description: 'High-end cars with extra comfort and style.',
    price: 22.0,
    eta: '5 mins',
    icon: 'premium',
  },
  {
    id: 'van',
    label: 'Van',
    description: 'Extra space for 6+ passengers or lots of luggage.',
    price: 30.0,
    eta: '5 mins',
    icon: 'van',
  },
] as const;

function StandardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
    </svg>
  );
}

function PremiumIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7-6.3-4.6L5.7 21l2.3-7-6-4.6h7.6L12 2z" />
    </svg>
  );
}

function VanIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19 7H4c-1.1 0-2 .9-2 2v9c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-2h12v2c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-9c0-1.1-.9-2-2-2zm-8 10H6v-2h5v2zm6 0h-3v-2h3v2zm0-4H5V9h12v4z" />
    </svg>
  );
}

const ICON_MAP = {
  standard: StandardIcon,
  premium: PremiumIcon,
  van: VanIcon,
} as const;

export interface RideSelectionDrawerProps {
  /** Whether the drawer is visible */
  isOpen: boolean;
  /** Called when the drawer should close (e.g. backdrop tap) */
  onClose?: () => void;
  /** Called when user taps "Confirm Pickup" with the selected ride id */
  onConfirm?: (rideId: string, price: number) => void;
}

export default function RideSelectionDrawer({
  isOpen,
  onClose,
  onConfirm,
}: RideSelectionDrawerProps) {
  const [selectedId, setSelectedId] = useState<string>(RIDE_OPTIONS[0].id);

  const selected = RIDE_OPTIONS.find((r) => r.id === selectedId) ?? RIDE_OPTIONS[0];

  const handleConfirm = () => {
    onConfirm?.(selectedId, selected.price);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/50 md:bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden
          />

          {/* Drawer */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Choose your ride"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-2xl bg-white shadow-2xl dark:bg-neutral-900"
          >
            {/* Drag handle */}
            <div className="flex justify-center py-3">
              <div className="h-1 w-12 rounded-full bg-neutral-300 dark:bg-neutral-600" />
            </div>

            <div className="flex flex-1 flex-col overflow-y-auto px-4 pb-6 pt-2 sm:px-6">
              <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-white">
                Choose your ride
              </h2>

              <ul className="space-y-3" role="radiogroup" aria-label="Ride options">
                {RIDE_OPTIONS.map((option) => {
                  const isSelected = selectedId === option.id;
                  const Icon = ICON_MAP[option.icon];
                  return (
                    <li key={option.id}>
                      <motion.button
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => setSelectedId(option.id)}
                        className={`flex w-full items-center gap-4 rounded-xl border-2 bg-neutral-50 p-4 text-left transition-colors dark:bg-neutral-800 sm:p-5 ${
                          isSelected
                            ? 'border-blue-500 ring-2 ring-blue-500/30 dark:border-blue-400 dark:ring-blue-400/30'
                            : 'border-transparent'
                        }`}
                        whileTap={{ scale: 0.99 }}
                      >
                        <span
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300 sm:h-14 sm:w-14"
                          aria-hidden
                        >
                          <Icon className="h-7 w-7 sm:h-8 sm:w-8" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="block font-semibold text-neutral-900 dark:text-white">
                            {option.label}
                          </span>
                          <span className="mt-0.5 block text-sm text-neutral-500 dark:text-neutral-400">
                            {option.description}
                          </span>
                          <span className="mt-1 block text-xs text-neutral-400 dark:text-neutral-500">
                            ETA {option.eta}
                          </span>
                        </div>
                        <span className="text-lg font-bold text-neutral-900 dark:text-white sm:text-xl">
                          ${option.price.toFixed(2)}
                        </span>
                      </motion.button>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-6">
                <motion.button
                  type="button"
                  onClick={handleConfirm}
                  className="w-full rounded-xl bg-blue-600 py-4 text-lg font-semibold text-white shadow-lg transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 sm:py-5 sm:text-xl"
                  whileTap={{ scale: 0.98 }}
                >
                  Confirm Pickup
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
