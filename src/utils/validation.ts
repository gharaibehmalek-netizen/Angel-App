import type { AppState } from '../types';
import { workMinutes, requiredBreak } from './timeUtils';

export interface Warning {
  type: 'unterbesetzung' | 'stunden' | 'pause' | 'urlaub';
  message: string;
  date?: string;
  employeeId?: string;
  severity: 'error' | 'warning';
}

export function getWarningsForDate(date: string, state: AppState): Warning[] {
  const warnings: Warning[] = [];
  const dayShifts = state.shifts.filter(s => s.date === date && s.status === 'anwesend');

  const presentEmployees = dayShifts.map(s => state.employees.find(e => e.id === s.employeeId)).filter(Boolean);
  const dentistCount = presentEmployees.filter(e => e!.role === 'Zahnärztin').length;
  const zfaCount = presentEmployees.filter(e => e!.role === 'ZFA').length;

  const d = new Date(date + 'T00:00:00');
  const isWeekend = d.getDay() === 0 || d.getDay() === 6;

  if (!isWeekend) {
    if (dentistCount < state.settings.minDentists) {
      warnings.push({
        type: 'unterbesetzung',
        message: `Zu wenig Zahnärztinnen: ${dentistCount}/${state.settings.minDentists}`,
        date,
        severity: 'error',
      });
    }
    if (zfaCount < state.settings.minZFA) {
      warnings.push({
        type: 'unterbesetzung',
        message: `Zu wenig ZFA: ${zfaCount}/${state.settings.minZFA}`,
        date,
        severity: 'error',
      });
    }
  }

  for (const shift of dayShifts) {
    const wm = workMinutes(shift.startTime, shift.endTime, shift.breakMinutes);
    const req = requiredBreak(wm + shift.breakMinutes);
    if (shift.breakMinutes < req) {
      const emp = state.employees.find(e => e.id === shift.employeeId);
      warnings.push({
        type: 'pause',
        message: `${emp?.name}: Pausenpflicht nicht erfüllt (mind. ${req} Min.)`,
        date,
        employeeId: shift.employeeId,
        severity: 'warning',
      });
    }
  }

  return warnings;
}

export function getMonthWarnings(year: number, month: number, state: AppState): Warning[] {
  const warnings: Warning[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    warnings.push(...getWarningsForDate(date, state));
  }
  return warnings;
}

export function getEmployeeMonthStats(employeeId: string, year: number, month: number, state: AppState) {
  const emp = state.employees.find(e => e.id === employeeId);
  if (!emp) return null;

  const shifts = state.shifts.filter(s => {
    if (s.employeeId !== employeeId) return false;
    const d = new Date(s.date + 'T00:00:00');
    return d.getFullYear() === year && d.getMonth() === month;
  });

  let actualMinutes = 0;
  let vacationDays = 0;
  let sickDays = 0;

  for (const s of shifts) {
    if (s.status === 'anwesend') {
      actualMinutes += workMinutes(s.startTime, s.endTime, s.breakMinutes);
    } else if (s.status === 'urlaub') {
      vacationDays++;
    } else if (s.status === 'krank') {
      sickDays++;
    }
  }

  // Contract hours per month (approx 4.33 weeks per month)
  const contractedMinutesPerMonth = emp.contractedHoursPerWeek * 60 * 4.33;

  const vacationUsed = state.shifts.filter(s => {
    if (s.employeeId !== employeeId || s.status !== 'urlaub') return false;
    const d = new Date(s.date + 'T00:00:00');
    return d.getFullYear() === year;
  }).length;

  return {
    actualMinutes,
    contractedMinutes: Math.round(contractedMinutesPerMonth),
    diffMinutes: actualMinutes - Math.round(contractedMinutesPerMonth),
    vacationDays,
    sickDays,
    vacationUsed,
    vacationRemaining: emp.vacationDaysTotal - vacationUsed,
  };
}

export function getEmployeeYearVacation(employeeId: string, year: number, state: AppState) {
  const emp = state.employees.find(e => e.id === employeeId);
  if (!emp) return null;

  const used = state.shifts.filter(s => {
    if (s.employeeId !== employeeId || s.status !== 'urlaub') return false;
    const d = new Date(s.date + 'T00:00:00');
    return d.getFullYear() === year;
  }).length;

  return {
    total: emp.vacationDaysTotal,
    used,
    remaining: emp.vacationDaysTotal - used,
  };
}
