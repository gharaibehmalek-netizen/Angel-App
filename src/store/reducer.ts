import type { AppState, Employee, ShiftEntry, DayNote, ShiftSwap, NavPage, ViewMode } from '../types';
import { isoDate } from '../utils/timeUtils';

export type Action =
  | { type: 'SET_PAGE'; page: NavPage }
  | { type: 'SET_VIEW'; view: ViewMode }
  | { type: 'SET_DATE'; date: string }
  | { type: 'UNLOCK'; pin: string }
  | { type: 'LOCK' }
  | { type: 'SET_PIN'; pin: string | null }
  | { type: 'ADD_EMPLOYEE'; employee: Employee }
  | { type: 'UPDATE_EMPLOYEE'; employee: Employee }
  | { type: 'DELETE_EMPLOYEE'; id: string }
  | { type: 'SET_SHIFT'; shift: ShiftEntry }
  | { type: 'DELETE_SHIFT'; id: string }
  | { type: 'SET_DAY_NOTE'; note: DayNote }
  | { type: 'DELETE_DAY_NOTE'; date: string }
  | { type: 'ADD_SHIFT_SWAP'; swap: ShiftSwap }
  | { type: 'UPDATE_PRACTICE_HOURS'; hours: AppState['practiceHours'] }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<AppState['settings']> }
  | { type: 'IMPORT_STATE'; state: AppState }
  | { type: 'COPY_WEEK_TEMPLATE'; sourceWeekStart: string; targetWeekStart: string }
  | { type: 'COPY_MONTH_TEMPLATE'; sourceYearMonth: string; targetYearMonth: string };

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_PAGE':
      return { ...state, currentPage: action.page };
    case 'SET_VIEW':
      return { ...state, currentView: action.view };
    case 'SET_DATE':
      return { ...state, currentDate: action.date };
    case 'UNLOCK':
      if (state.settings.pin === null || state.settings.pin === action.pin) {
        return { ...state, settings: { ...state.settings, isUnlocked: true } };
      }
      return state;
    case 'LOCK':
      return { ...state, settings: { ...state.settings, isUnlocked: false } };
    case 'SET_PIN':
      return { ...state, settings: { ...state.settings, pin: action.pin, isUnlocked: true } };
    case 'ADD_EMPLOYEE':
      return { ...state, employees: [...state.employees, action.employee] };
    case 'UPDATE_EMPLOYEE':
      return {
        ...state,
        employees: state.employees.map(e => e.id === action.employee.id ? action.employee : e),
      };
    case 'DELETE_EMPLOYEE':
      return {
        ...state,
        employees: state.employees.filter(e => e.id !== action.id),
        shifts: state.shifts.filter(s => s.employeeId !== action.id),
      };
    case 'SET_SHIFT': {
      const existing = state.shifts.findIndex(s => s.id === action.shift.id);
      if (existing >= 0) {
        const shifts = [...state.shifts];
        shifts[existing] = action.shift;
        return { ...state, shifts };
      }
      // Also check by date+employeeId to avoid duplicates
      const byDate = state.shifts.findIndex(s => s.date === action.shift.date && s.employeeId === action.shift.employeeId);
      if (byDate >= 0) {
        const shifts = [...state.shifts];
        shifts[byDate] = action.shift;
        return { ...state, shifts };
      }
      return { ...state, shifts: [...state.shifts, action.shift] };
    }
    case 'DELETE_SHIFT':
      return { ...state, shifts: state.shifts.filter(s => s.id !== action.id) };
    case 'SET_DAY_NOTE': {
      const existing = state.dayNotes.findIndex(n => n.date === action.note.date);
      if (existing >= 0) {
        const notes = [...state.dayNotes];
        notes[existing] = action.note;
        return { ...state, dayNotes: notes };
      }
      return { ...state, dayNotes: [...state.dayNotes, action.note] };
    }
    case 'DELETE_DAY_NOTE':
      return { ...state, dayNotes: state.dayNotes.filter(n => n.date !== action.date) };
    case 'ADD_SHIFT_SWAP':
      return { ...state, shiftSwaps: [...state.shiftSwaps, action.swap] };
    case 'UPDATE_PRACTICE_HOURS':
      return { ...state, practiceHours: action.hours };
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.settings } };
    case 'IMPORT_STATE':
      return { ...action.state, settings: { ...action.state.settings, isUnlocked: true } };
    case 'COPY_MONTH_TEMPLATE': {
      const [srcYear, srcMonth] = action.sourceYearMonth.split('-').map(Number);
      const [tgtYear, tgtMonth] = action.targetYearMonth.split('-').map(Number);
      const srcShifts = state.shifts.filter(s => {
        const d = new Date(s.date + 'T00:00:00');
        return d.getFullYear() === srcYear && d.getMonth() === srcMonth - 1;
      });
      const newShifts: ShiftEntry[] = [];
      for (const s of srcShifts) {
        const srcDate = new Date(s.date + 'T00:00:00');
        const dayOfMonth = srcDate.getDate();
        const tgtDate = new Date(tgtYear, tgtMonth - 1, dayOfMonth);
        if (tgtDate.getMonth() !== tgtMonth - 1) continue;
        const tgtDateStr = isoDate(tgtDate);
        if (!state.shifts.some(x => x.date === tgtDateStr && x.employeeId === s.employeeId)) {
          newShifts.push({ ...s, id: `s-${Date.now()}-${Math.random()}`, date: tgtDateStr });
        }
      }
      return { ...state, shifts: [...state.shifts, ...newShifts] };
    }
    default:
      return state;
  }
}
