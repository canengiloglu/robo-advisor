export const fmtTL = (v: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(v);

export const pct = (v: number) => `%${v.toFixed(2)}`;

const STALE_DAYS = 7;

export function formatAge(ts: number): { days: number; label: string; stale: boolean } {
  const days = Math.floor((Date.now() - ts) / (1000 * 60 * 60 * 24));
  const label = days === 0 ? 'bugün' : days === 1 ? '1 gün önce' : `${days} gün önce`;
  return { days, label, stale: days >= STALE_DAYS };
}
