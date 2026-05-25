import { useState } from 'react';
import { useStore } from '../../store/StoreContext';
import { ShiftModal } from './ShiftModal';
import type { Employee, ShiftStatus } from '../../types';
import { isoDate, parseDate, WEEKDAY_NAMES_LONG, MONTH_NAMES, workMinutes, hoursLabel } from '../../utils/timeUtils';
import { getHolidayMap } from '../../utils/holidays';
import { getWarningsForDate } from '../../utils/validation';
import { AlertTriangle, Plus, Clock } from 'lucide-react';

const STATUS_COLORS: Record<ShiftStatus, string> = {
  anwesend: 'bg-green-50 border-green-200 text-green-800',
  urlaub: 'bg-blue-50 border-blue-200 text-blue-800',
  krank: 'bg-red-50 border-red-200 text-red-800',
  frei: 'bg-gray-50 border-gray-200 text-gray-600',
  sonderurlaub: 'bg-amber-50 border-amber-200 text-amber-800',
};

const STATUS_LABEL: Record<ShiftStatus, string> = {
  anwesend: 'Anwesend',
  urlaub: 'Urlaub',
  krank: 'Krank',
  frei: 'Frei / Kein Dienst',
  sonderurlaub: 'Sonderurlaub',
};

export function DayView() {
  const { state } = useStore();
  const [modal, setModal] = useState<{ employee: Employee; date: string } | null>(null);

  const anchor = parseDate(state.currentDate);
  const ds = isoDate(anchor);
  const today = isoDate(new Date());
  const isToday = ds === today;
  const dow = anchor.getDay() === 0 ? 6 : anchor.getDay() - 1;
  const holidayMap = getHolidayMap([anchor.getFullYear(), anchor.getFullYear() + 1]);
  const holiday = holidayMap[ds];
  const warnings = getWarningsForDate(ds, state);
  const dayShifts = state.shifts.filter(s => s.date === ds);

  const presentCount = dayShifts.filter(s => s.status === 'anwesend').length;
  const totalWork = dayShifts
    .filter(s => s.status === 'anwesend')
    .reduce((sum, s) => sum + workMinutes(s.startTime, s.endTime, s.breakMinutes), 0);

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          {WEEKDAY_NAMES_LONG[dow]}, {anchor.getDate()}. {MONTH_NAMES[anchor.getMonth()]} {anchor.getFullYear()}
          {isToday && <span className="ml-2 text-sm bg-blue-600 text-white px-2 py-0.5 rounded-full">Heute</span>}
        </h2>
        {holiday && (
          <div className="mt-1 text-sm text-amber-600 font-medium">🎉 Feiertag: {holiday}</div>
        )}
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="mb-4 space-y-2">
          {warnings.map((w, i) => (
            <div key={i} className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm ${
              w.severity === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {w.message}
            </div>
          ))}
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500 mb-1">Anwesend</div>
          <div className="text-2xl font-bold text-gray-900">{presentCount} <span className="text-sm font-normal text-gray-400">Personen</span></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500 mb-1">Gesamtstunden</div>
          <div className="text-2xl font-bold text-gray-900">{hoursLabel(totalWork)}</div>
        </div>
      </div>

      {/* Employee list */}
      <div className="space-y-3">
        {state.employees.map(emp => {
          const shift = dayShifts.find(s => s.employeeId === emp.id);
          const workDay = emp.workingDays[dow];
          const wm = shift?.status === 'anwesend' ? workMinutes(shift.startTime, shift.endTime, shift.breakMinutes) : 0;

          return (
            <div
              key={emp.id}
              onClick={() => setModal({ employee: emp, date: ds })}
              className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                  style={{ backgroundColor: emp.color }}>
                  {emp.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{emp.name}</span>
                    <span className="text-xs text-gray-400">{emp.role}</span>
                  </div>
                  {shift ? (
                    <div className="mt-2 flex items-center gap-3 flex-wrap">
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_COLORS[shift.status]}`}>
                        {STATUS_LABEL[shift.status]}
                      </span>
                      {shift.status === 'anwesend' && shift.startTime && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {shift.startTime} – {shift.endTime}
                          {shift.breakMinutes > 0 && ` (${shift.breakMinutes} Min. Pause)`}
                          {' · '}{hoursLabel(wm)}
                        </span>
                      )}
                      {shift.notes && (
                        <span className="text-xs text-gray-400 italic">{shift.notes}</span>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                      <Plus className="w-3 h-3" />
                      {workDay?.active ? 'Schicht eintragen' : 'Kein Arbeitstag (laut Vertrag)'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <ShiftModal
          employee={modal.employee}
          date={modal.date}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
