import type { AppState } from '../types';
import { isoDate } from '../utils/timeUtils';

const today = isoDate(new Date());

export const DEFAULT_PRACTICE_HOURS: AppState['practiceHours'] = {
  0: { closed: false, morning: { start: '08:00', end: '13:00' }, afternoon: { start: '14:00', end: '18:00' } }, // Mo
  1: { closed: false, morning: { start: '08:00', end: '15:00' }, afternoon: { start: '16:00', end: '20:00' } }, // Di
  2: { closed: false, morning: { start: '08:00', end: '13:00' } },                                              // Mi
  3: { closed: false, morning: { start: '08:00', end: '13:00' }, afternoon: { start: '14:00', end: '18:00' } }, // Do
  4: { closed: false, morning: { start: '08:00', end: '13:00' } },                                              // Fr
  5: { closed: true },                                                                                            // Sa
  6: { closed: true },                                                                                            // So
};

export const INITIAL_STATE: AppState = {
  employees: [
    {
      id: 'emp-1',
      name: 'Dr. Ida-Sophie Kranz',
      role: 'Zahnärztin',
      contractedHoursPerWeek: 40,
      vacationDaysTotal: 30,
      color: '#2563eb',
      workingDays: {
        0: { active: true, start: '08:00', end: '18:00', breakMinutes: 60 },
        1: { active: true, start: '08:00', end: '20:00', breakMinutes: 60 },
        2: { active: true, start: '08:00', end: '13:00', breakMinutes: 0 },
        3: { active: true, start: '08:00', end: '18:00', breakMinutes: 60 },
        4: { active: true, start: '08:00', end: '13:00', breakMinutes: 0 },
        5: { active: false, start: '08:00', end: '13:00', breakMinutes: 0 },
        6: { active: false, start: '08:00', end: '13:00', breakMinutes: 0 },
      },
    },
    {
      id: 'emp-2',
      name: 'Maria Schmidt',
      role: 'ZFA',
      contractedHoursPerWeek: 38,
      vacationDaysTotal: 28,
      color: '#16a34a',
      workingDays: {
        0: { active: true, start: '08:00', end: '18:00', breakMinutes: 60 },
        1: { active: true, start: '08:00', end: '20:00', breakMinutes: 60 },
        2: { active: true, start: '08:00', end: '13:00', breakMinutes: 0 },
        3: { active: true, start: '08:00', end: '18:00', breakMinutes: 60 },
        4: { active: true, start: '08:00', end: '13:00', breakMinutes: 0 },
        5: { active: false, start: '08:00', end: '13:00', breakMinutes: 0 },
        6: { active: false, start: '08:00', end: '13:00', breakMinutes: 0 },
      },
    },
    {
      id: 'emp-3',
      name: 'Jana Müller',
      role: 'ZFA',
      contractedHoursPerWeek: 30,
      vacationDaysTotal: 25,
      color: '#9333ea',
      workingDays: {
        0: { active: true, start: '08:00', end: '13:00', breakMinutes: 0 },
        1: { active: true, start: '08:00', end: '15:00', breakMinutes: 30 },
        2: { active: false, start: '08:00', end: '13:00', breakMinutes: 0 },
        3: { active: true, start: '08:00', end: '13:00', breakMinutes: 0 },
        4: { active: true, start: '08:00', end: '13:00', breakMinutes: 0 },
        5: { active: false, start: '08:00', end: '13:00', breakMinutes: 0 },
        6: { active: false, start: '08:00', end: '13:00', breakMinutes: 0 },
      },
    },
    {
      id: 'emp-4',
      name: 'Sabine Weber',
      role: 'Empfang',
      contractedHoursPerWeek: 25,
      vacationDaysTotal: 25,
      color: '#ea580c',
      workingDays: {
        0: { active: true, start: '08:00', end: '13:00', breakMinutes: 0 },
        1: { active: true, start: '16:00', end: '20:00', breakMinutes: 0 },
        2: { active: true, start: '08:00', end: '13:00', breakMinutes: 0 },
        3: { active: true, start: '08:00', end: '13:00', breakMinutes: 0 },
        4: { active: true, start: '08:00', end: '13:00', breakMinutes: 0 },
        5: { active: false, start: '08:00', end: '13:00', breakMinutes: 0 },
        6: { active: false, start: '08:00', end: '13:00', breakMinutes: 0 },
      },
    },
  ],
  shifts: [],
  dayNotes: [],
  shiftSwaps: [],
  practiceHours: DEFAULT_PRACTICE_HOURS,
  settings: {
    pin: null,
    isUnlocked: true,
    minDentists: 1,
    minZFA: 2,
    practiceName: 'Zahnarztpraxis Ida-Sophie Kranz & Kollegen',
    practiceAddress: 'Wörthstraße 20, 45138 Essen',
  },
  currentView: 'woche',
  currentPage: 'dashboard',
  currentDate: today,
};
