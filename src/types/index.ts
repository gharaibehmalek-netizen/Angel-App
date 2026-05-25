export type EmployeeRole = 'Zahnärztin' | 'ZFA' | 'Empfang' | 'Azubi';
export type ShiftStatus = 'anwesend' | 'urlaub' | 'krank' | 'frei' | 'sonderurlaub';
export type ViewMode = 'monat' | 'woche' | 'tag';
export type NavPage = 'dashboard' | 'kalender' | 'mitarbeiter' | 'einstellungen' | 'export';

export interface WorkingDayConfig {
  active: boolean;
  start: string;
  end: string;
  breakMinutes: number;
}

export interface Employee {
  id: string;
  name: string;
  role: EmployeeRole;
  contractedHoursPerWeek: number;
  vacationDaysTotal: number;
  color: string;
  workingDays: Record<number, WorkingDayConfig>; // 0=Mon..6=Sun
}

export interface ShiftEntry {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  status: ShiftStatus;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  notes: string;
}

export interface DayNote {
  date: string;
  note: string;
}

export interface ShiftSwap {
  id: string;
  date: string;
  employee1Id: string;
  employee2Id: string;
  timestamp: string;
  reason: string;
}

export interface PracticeHourSlot {
  start: string;
  end: string;
}

export interface PracticeHoursDay {
  closed: boolean;
  morning?: PracticeHourSlot;
  afternoon?: PracticeHourSlot;
}

export type PracticeHours = Record<number, PracticeHoursDay>; // 0=Mon..6=Sun

export interface OvertimeEntry {
  yearMonth: string; // YYYY-MM
  minutes: number;
  carryOver: number;
}

export interface AppSettings {
  pin: string | null;
  isUnlocked: boolean;
  minDentists: number;
  minZFA: number;
  practiceName: string;
  practiceAddress: string;
}

export interface AppState {
  employees: Employee[];
  shifts: ShiftEntry[];
  dayNotes: DayNote[];
  shiftSwaps: ShiftSwap[];
  practiceHours: PracticeHours;
  settings: AppSettings;
  currentView: ViewMode;
  currentPage: NavPage;
  currentDate: string; // YYYY-MM-DD - anchor date for current view
}
