import { useState } from 'react';
import { useStore } from '../../store/StoreContext';
import { ShiftModal } from './ShiftModal';
import type { Employee, ShiftStatus } from '../../types';
import {
  isoDate, parseDate, addDays, getDaysInMonth, WEEKDAY_NAMES
} from '../../utils/timeUtils';
import { getHolidayMap } from '../../utils/holidays';
import { getWarningsForDate } from '../../utils/validation';
import { AlertTriangle } from 'lucide-react';

const STATUS_DOT: Record<ShiftStatus, string> = {
  anwesend: 'bg-green-500',
  urlaub: 'bg-blue-500',
  krank: 'bg-red-500',
  frei: 'bg-gray-300',
  sonderurlaub: 'bg-amber-400',
};

export function MonthView() {
  const { state } = useStore();
  const [modal, setModal] = useState<{ employee: Employee; date: string } | null>(null);

  const anchor = parseDate(state.currentDate);
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const today = isoDate(new Date());

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = daysInMonth[0];
  const firstWeekday = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const paddingDays = Array.from({ length: firstWeekday }, (_, i) =>
    addDays(firstDay, -(firstWeekday - i))
  );
  const holidayMap = getHolidayMap([year, year + 1]);

  const allDays = [...paddingDays, ...daysInMonth];
  // Pad to complete last week
  while (allDays.length % 7 !== 0) allDays.push(addDays(allDays[allDays.length - 1], 1));

  return (
    <div className="p-4">
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAY_NAMES.map(d => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-2">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {allDays.map((day, idx) => {
          const ds = isoDate(day);
          const inMonth = day.getMonth() === month;
          const isToday = ds === today;
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;
          const holiday = holidayMap[ds];
          const warnings = inMonth ? getWarningsForDate(ds, state) : [];
          const hasError = warnings.some(w => w.severity === 'error');
          const dayShifts = inMonth ? state.shifts.filter(s => s.date === ds) : [];

          return (
            <div
              key={`${ds}-${idx}`}
              className={`rounded-xl border min-h-[80px] p-1.5 flex flex-col ${
                !inMonth ? 'bg-gray-50/50 border-gray-100' :
                isToday ? 'bg-blue-50 border-blue-200' :
                isWeekend || holiday ? 'bg-gray-50 border-gray-100' :
                'bg-white border-gray-100 hover:border-gray-200'
              }`}
            >
              {/* Day number */}
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-bold ${
                  !inMonth ? 'text-gray-300' :
                  isToday ? 'text-blue-700' :
                  isWeekend ? 'text-gray-400' : 'text-gray-700'
                }`}>
                  {day.getDate()}
                </span>
                <div className="flex items-center gap-0.5">
                  {hasError && <AlertTriangle className="w-3 h-3 text-red-400" />}
                  {holiday && <span className="text-[8px] text-amber-600 font-medium truncate max-w-[40px]" title={holiday}>🎉</span>}
                </div>
              </div>

              {/* Shift dots */}
              {inMonth && (
                <div className="flex flex-wrap gap-0.5">
                  {state.employees.map(emp => {
                    const shift = dayShifts.find(s => s.employeeId === emp.id);
                    return (
                      <button
                        key={emp.id}
                        onClick={() => setModal({ employee: emp, date: ds })}
                        title={`${emp.name}: ${shift ? shift.status : 'kein Eintrag'}`}
                        className={`w-4 h-4 rounded-sm flex items-center justify-center transition-transform hover:scale-110`}
                        style={{ backgroundColor: shift ? undefined : '#f3f4f6' }}
                      >
                        {shift ? (
                          <div className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[shift.status]}`} />
                        ) : (
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: emp.color + '33' }} />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100">
        {([['anwesend', 'Anwesend'], ['urlaub', 'Urlaub'], ['krank', 'Krank'], ['sonderurlaub', 'Sonderurlaub'], ['frei', 'Frei']] as [ShiftStatus, string][]).map(([s, l]) => (
          <div key={s} className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[s]}`} />
            {l}
          </div>
        ))}
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
