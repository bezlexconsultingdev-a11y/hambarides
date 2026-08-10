/** Normalize and label Hamba ride / vehicle categories for admin UI. */

const LABELS: Record<string, string> = {
  lite: 'Hamba Lite',
  comfort: 'Hamba Comfort',
  plus: 'Hamba Plus',
  max: 'Hamba Max',
};

export type HambaCategoryId = 'lite' | 'comfort' | 'plus' | 'max';

export function isWomenOnlyRideType(raw?: string | null): boolean {
  return String(raw || '')
    .toLowerCase()
    .includes('women');
}

export function normalizeHambaCategory(raw?: string | null): HambaCategoryId {
  const value = String(raw || 'lite').toLowerCase().trim();
  if (
    value === 'lite' ||
    value === 'hamba_lite' ||
    value === 'lite_women' ||
    value === 'economy' ||
    value === 'economy_women'
  ) {
    return 'lite';
  }
  if (
    value === 'comfort' ||
    value === 'hamba_comfort' ||
    value === 'comfort_women' ||
    value === 'go' ||
    value === 'hamba_go'
  ) {
    return 'comfort';
  }
  if (
    value === 'plus' ||
    value === 'hamba_plus' ||
    value === 'plus_women' ||
    value === 'standard' ||
    value === 'standard_women'
  ) {
    return 'plus';
  }
  if (
    value === 'max' ||
    value === 'hamba_max' ||
    value === 'max_women' ||
    value === 'xl' ||
    value === 'hamba_xl'
  ) {
    return 'max';
  }
  return 'lite';
}

export function formatHambaCategoryLabel(raw?: string | null): string {
  const base = LABELS[normalizeHambaCategory(raw)] || LABELS.lite;
  return isWomenOnlyRideType(raw) ? `${base} · Women` : base;
}

/** Filter match: selected category includes legacy DB values and optional women variants. */
export function rideTypeMatchesFilter(rideType: string | null | undefined, filter: string): boolean {
  if (!filter) return true;
  const value = String(filter).toLowerCase();
  if (value.endsWith('_women') || value === 'women') {
    if (!isWomenOnlyRideType(rideType)) return false;
    if (value === 'women') return true;
    return normalizeHambaCategory(rideType) === normalizeHambaCategory(filter);
  }
  // Base category filter includes both regular and women-only of that tier.
  return normalizeHambaCategory(rideType) === normalizeHambaCategory(filter);
}

export const HAMBA_CATEGORY_FILTER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'lite', label: 'Hamba Lite' },
  { value: 'comfort', label: 'Hamba Comfort' },
  { value: 'plus', label: 'Hamba Plus' },
  { value: 'max', label: 'Hamba Max' },
  { value: 'lite_women', label: 'Hamba Lite · Women' },
  { value: 'comfort_women', label: 'Hamba Comfort · Women' },
  { value: 'plus_women', label: 'Hamba Plus · Women' },
  { value: 'max_women', label: 'Hamba Max · Women' },
];
