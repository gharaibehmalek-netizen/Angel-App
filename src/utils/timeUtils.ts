export function parseMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function formatMinutes(minutes: number): string {
  const h = Math.floor(Math.abs(minutes) / 60);
  const m = Math.abs(minutes) % 60;
  const sign = minutes < 0 ? '-' : '';
  return `${sign}${h}:${m.toString().padStart(2, '0')}`;
}

export function workMinutes(start: string, end: string, breakMin: number): number {
  if (!start || !end) return 0;
  const diff = parseMinutes(end) - parseMinutes(start);
  return Math.max(0, diff - breakMin);
}

export function requiredBreak(workMin: number): number {
  if (workMin >= 9 * 60) return 45;
  if (workMin >= 6 * 60) return 30;
  return 0;
}

export function hoursLabel(minutes: number): string {
  return `${(minutes / 60).toFixed(1)} h`;
}

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function parseDate(iso: string): Date {
  return new Date(iso + 'T00:00:00');
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

export function getWeekDays(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export const WEEKDAY_NAMES = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
export const WEEKDAY_NAMES_LONG = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
export const MONTH_NAMES = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
];

// day-of-week index where 0=Monday (like isoWeekday)
export function isoWeekday(date: Date): number {
  const d = date.getDay();
  return d === 0 ? 6 : d - 1;
}
