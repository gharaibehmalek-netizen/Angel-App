import { useState } from 'react';
import { useStore } from '../../store/StoreContext';
import { ShiftModal } from './ShiftModal';
import type { Employee, ShiftStatus } from '../../types';
import {
  isoDate, parseDate, startOfWeek, getWeekDays,
  WEEKDAY_NAMES, WEEKDAY_NAMES_LONG,
} from '../../utils/timeUtils';
import { getWarningsForDate } from '../../utils/validation';
import { getHolidayMap } from '../../utils/holidays';
import { AlertTriangle } from 'lucide-react';

const STATUS_COLORS: Record<ShiftStatus, string> = {
  anwesend: 'bg-green-100 text-green-800 border-green-200',
  urlaub: 'bg-blue-100 text-blue-800 border-blue-200',
  krank: 'bg-red-100 text-red-800 border-red-200',
  frei: 'bg-gray-100 text-gray-500 border-gray-200',
  sonderurlaub: 'bg-amber-100 text-amber-800 border-amber-200',
};

const STATUS_LABEL: Record<ShiftStatus, string> = {
  anwesend: 'Anwesend',
  urlaub: 'Urlaub',
  krank: 'Krank',
  frei: 'Frei',
  sonderurlaub: 'Sonderurl.',
};

export function WeekView() {
  const { state } = useStore();
  const [modal, setModal] = useState<{ employee: Employee; date: string } | null>(null);

  const anchor = parseDate(state.currentDate);
  const monday = startOfWeek(anchor);
  const days = getWeekDays(monday);
  const today = isoDate(new Date());
  const year = monday.getFullYear();
  const holidayMap = getHolidayMap([year, year + 1]);

  const openModal = (employee: Employee, date: string) => setModal({ employee, date });

  return (
    <div className="flex-1 overflow-auto">
      <div className="min-w-[700px]">
        {/* Day headers */}
        <div className="grid sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm"
          style={{ gridTemplateColumns: `200px repeat(7, 1fr)` }}>
          <div className="p-3 text-xs font-medium text-gray-400 border-r border-gray-100">Mitarbeiter</div>
          {days.map((day, i) => {
            const ds = isoDate(day);
            const isToday = ds === today;
            const holiday = holidayMap[ds];
            const warnings = getWarningsForDate(ds, state);
            const hasError = warnings.some(w => w.severity === 'error');
            return (
              <div key={ds} className={`p-3 text-center border-r border-gray-100 last:border-r-0 ${isToday ? 'bg-blue-50' : ''}`}>
                <div className={`text-xs font-medium ${isToday ? 'text-blue-600' : 'text-gray-500'}`}>
                  {WEEKDAY_NAMES[i]}
                </div>
                <div className={`text-sm font-bold mt-0.5 ${isToday ? 'text-blue-700' : 'text-gray-900'}`}>
                  {day.getDate()}.{day.getMonth() + 1}.
                </div>
                {holiday && (
                  <div className="text-[10px] text-amber-600 font-medium truncate mt-0.5">{holiday}</div>
                )}
                {hasError && !holiday && (
                  <AlertTriangle className="w-3 h-3 text-red-500 mx-auto mt-0.5" />
                )}
              </div>
            );
          })}
        </div>

        {/* Employee rows */}
        {state.employees.map(emp => (
          <div key={emp.id}
            className="grid border-b border-gray-100 hover:bg-gray-50/50 group"
            style={{ gridTemplateColumns: `200px repeat(7, 1fr)` }}>
            {/* Employee name cell */}
            <div className="flex items-center gap-2.5 p-3 border-r border-gray-100">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: emp.color }} />
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{emp.name}</div>
                <div className="text-xs text-gray-400">{emp.role}</div>
              </div>
            </div>
            {/* Day cells */}
            {days.map(day => {
              const ds = isoDate(day);
              const isToday = ds === today;
              const shift = state.shifts.find(s => s.employeeId === emp.id && s.date === ds);
              const dow = day.getDay() === 0 ? 6 : day.getDay() - 1;
              const workDay = emp.workingDays[dow];
              const isWorkDay = workDay?.active;
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              const isHoliday = !!holidayMap[ds];

              return (
                <div
                  key={ds}
                  onClick={() => openModal(emp, ds)}
                  className={`p-2 border-r border-gray-100 last:border-r-0 cursor-pointer min-h-[68px] flex flex-col justify-center transition-colors ${
                    isToday ? 'bg-blue-50/50' : ''
                  } ${isWeekend || isHoliday ? 'bg-gray-50/80' : ''} hover:bg-blue-50`}
                >
                  {shift ? (
                    <div className={`text-xs rounded-lg border px-2 py-1.5 ${STATUS_COLORS[shift.status]}`}>
                      <div className="font-semibold">{STATUS_LABEL[shift.status]}</div>
                      {shift.status === 'anwesend' && shift.startTime && (
                        <div className="text-[10px] opacity-75 mt-0.5">
                          {shift.startTime}–{shift.endTime}
                          {shift.breakMinutes > 0 && ` (${shift.breakMinutes}′)`}
                        </div>
                      )}
                      {shift.notes && (
                        <div className="text-[10px] opacity-60 mt-0.5 truncate" title={shift.notes}>
                          {shift.notes}
                        </div>
                      )}
                    </div>
                  ) : isWorkDay ? (
                    <div className="text-[10px] text-gray-300 text-center group-hover:text-gray-400 transition-colors">
                      + Eintragen
                    </div>
                  ) : (
                    <div className="text-[10px] text-gray-200 text-center">–</div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {state.employees.length === 0 && (
          <div className="py-16 text-center text-gray-400 text-sm">
            Noch keine Mitarbeiter angelegt. Gehe zu „Mitarbeiter" um welche hinzuzufügen.
          </div>
        )}
      </div>

      {/* Warnings footer */}
      {days.some(d => getWarningsForDate(isoDate(d), state).length > 0) && (
        <div className="m-4 space-y-1">
          {days.flatMap(d => getWarningsForDate(isoDate(d), state).map((w, i) => (
            <div key={`${isoDate(d)}-${i}`}
              className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${
                w.severity === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              {WEEKDAY_NAMES_LONG[days.findIndex(dd => isoDate(dd) === w.date)]}: {w.message}
            </div>
          )))}
        </div>
      )}

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
