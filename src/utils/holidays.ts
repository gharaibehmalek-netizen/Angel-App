// Gaußsche Osterformel
function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export interface Holiday {
  date: string;
  name: string;
}

export function getNRWHolidays(year: number): Holiday[] {
  const easter = easterSunday(year);
  return [
    { date: `${year}-01-01`, name: 'Neujahr' },
    { date: `${year}-01-06`, name: 'Heilige Drei Könige' },
    { date: fmt(addDays(easter, -2)), name: 'Karfreitag' },
    { date: fmt(easter), name: 'Ostersonntag' },
    { date: fmt(addDays(easter, 1)), name: 'Ostermontag' },
    { date: `${year}-05-01`, name: 'Tag der Arbeit' },
    { date: fmt(addDays(easter, 39)), name: 'Christi Himmelfahrt' },
    { date: fmt(addDays(easter, 49)), name: 'Pfingstsonntag' },
    { date: fmt(addDays(easter, 50)), name: 'Pfingstmontag' },
    { date: fmt(addDays(easter, 60)), name: 'Fronleichnam' },
    { date: `${year}-10-03`, name: 'Tag der Deutschen Einheit' },
    { date: `${year}-11-01`, name: 'Allerheiligen' },
    { date: `${year}-12-25`, name: '1. Weihnachtstag' },
    { date: `${year}-12-26`, name: '2. Weihnachtstag' },
  ];
}

export function getHolidayMap(years: number[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const y of years) {
    for (const h of getNRWHolidays(y)) {
      map[h.date] = h.name;
    }
  }
  return map;
}
