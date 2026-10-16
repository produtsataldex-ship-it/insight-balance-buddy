// Category palette: gold, amber, copper, bronze and neutrals only (Patrion never uses green).
export const CATEGORY_COLORS = ['#D4AF37', '#E3C77A', '#B89435', '#C8873A', '#A8693C', '#8C6A3F', '#F5F5F5', '#929292'] as const;

export function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9A-Fa-f]{6}$/.test(value);
}

export function categoryColor(category?: { color?: string | null } | null, fallback = 'var(--primary)') {
  return isHexColor(category?.color) ? category.color : fallback;
}

/** Hue in degrees for a hex color; used to keep the palette free of green. */
export function hue(hex: string) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (d === 0) return null;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}

/** Welcome prompt shows on first access or after 7+ days away. */
export const INACTIVITY_DAYS = 7;
export function shouldShowWelcome(profile: { welcome_seen_at: string | null; last_seen_at: string | null } | null | undefined, now = new Date()) {
  if (!profile) return false;
  if (!profile.welcome_seen_at) return true;
  if (!profile.last_seen_at) return false;
  return now.getTime() - new Date(profile.last_seen_at).getTime() >= INACTIVITY_DAYS * 86400000;
}
