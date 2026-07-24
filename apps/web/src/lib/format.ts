const currencyFormatter = new Intl.NumberFormat('ar-SY');
const relativeTimeFormatter = new Intl.RelativeTimeFormat('ar', { numeric: 'auto' });
const timeFormatter = new Intl.DateTimeFormat('ar-SY', { hour: 'numeric', minute: '2-digit' });

export function formatSyp(value: string | number): string {
  const num = typeof value === 'string' ? Number(value) : value;
  return `${currencyFormatter.format(num)} ل.س`;
}

export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60_000);
  if (Math.abs(diffMinutes) < 60) return relativeTimeFormatter.format(diffMinutes, 'minute');
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return relativeTimeFormatter.format(diffHours, 'hour');
  const diffDays = Math.round(diffHours / 24);
  return relativeTimeFormatter.format(diffDays, 'day');
}

export function formatClockTime(iso: string): string {
  return timeFormatter.format(new Date(iso));
}

export function initialOf(name: string): string {
  return name.trim().charAt(0) || 'م';
}
