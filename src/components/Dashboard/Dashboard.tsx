
import { useStore } from '../../store/StoreContext';
import {
  Users, AlertTriangle, Calendar, CheckCircle2
} from 'lucide-react';
import {
  isoDate, parseDate, startOfWeek, getWeekDays, WEEKDAY_NAMES, MONTH_NAMES
} from '../../utils/timeUtils';
import { getWarningsForDate, getEmployeeMonthStats } from '../../utils/validation';
import { getHolidayMap } from '../../utils/holidays';
import type { ShiftStatus } from '../../types';

const STATUS_LABEL: Record<ShiftStatus, string> = {
  anwesend: 'Anwesend',
  urlaub: 'Urlaub',
  krank: 'Krank',
  frei: 'Frei',
  sonderurlaub: 'Sonderurlaub',
};

const STATUS_COLORS: Record<ShiftStatus, string> = {
  anwesend: 'bg-green-100 text-green-800',
  urlaub: 'bg-blue-100 text-blue-800',
  krank: 'bg-red-100 text-red-800',
  frei: 'bg-gray-100 text-gray-600',
  sonderurlaub: 'bg-amber-100 text-amber-800',
};

export function Dashboard() {
  const { state, dispatch } = useStore();
  const today = isoDate(new Date());
  const todayDate = parseDate(today);
  const year = todayDate.getFullYear();
  const month = todayDate.getMonth();

  const holidayMap = getHolidayMap([year, year + 1]);
  const todayHoliday = holidayMap[today];

  // Today's shifts
  const todayShifts = state.shifts.filter(s => s.date === today);
  const presentToday = todayShifts.filter(s => s.status === 'anwesend');
  // Warnings for today
  const warnings = getWarningsForDate(today, state);

  // Week stats
  const weekStart = startOfWeek(todayDate);
  const weekDays = getWeekDays(weekStart);

  let weekPresent = 0;
  let weekVacation = 0;
  let weekSick = 0;
  for (const day of weekDays) {
    const ds = isoDate(day);
    const shifts = state.shifts.filter(s => s.date === ds);
    weekPresent += shifts.filter(s => s.status === 'anwesend').length;
    weekVacation += shifts.filter(s => s.status === 'urlaub').length;
    weekSick += shifts.filter(s => s.status === 'krank').length;
  }

  // Vacation overview for current year
  const vacationOverview = state.employees.map(emp => {
    const used = state.shifts.filter(s => {
      if (s.employeeId !== emp.id || s.status !== 'urlaub') return false;
      const d = parseDate(s.date);
      return d.getFullYear() === year;
    }).length;
    return {
      emp,
      used,
      total: emp.vacationDaysTotal,
      remaining: emp.vacationDaysTotal - used,
    };
  });

  // Monthly stats for each employee
  const monthStats = state.employees.map(emp => ({
    emp,
    stats: getEmployeeMonthStats(emp.id, year, month, state),
  }));

  const goToCalendar = () => {
    dispatch({ type: 'SET_PAGE', page: 'kalender' });
    dispatch({ type: 'SET_VIEW', view: 'woche' });
    dispatch({ type: 'SET_DATE', date: today });
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{state.settings.practiceName}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {todayDate.toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          {todayHoliday && <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">{todayHoliday}</span>}
        </p>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((w, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 p-3 rounded-lg border ${
                w.severity === 'error'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}
            >
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span className="text-sm font-medium">{w.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Quick stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-medium">Anwesend heute</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{presentToday.length}</div>
          <div className="text-xs text-gray-500 mt-1">von {state.employees.length} Mitarbeitern</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <Calendar className="w-5 h-5" />
            <span className="text-sm font-medium">Urlaub diese Woche</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{weekVacation}</div>
          <div className="text-xs text-gray-500 mt-1">Einträge</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-sm font-medium">Krank diese Woche</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{weekSick}</div>
          <div className="text-xs text-gray-500 mt-1">Einträge</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-purple-600 mb-2">
            <Users className="w-5 h-5" />
            <span className="text-sm font-medium">Team gesamt</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{state.employees.length}</div>
          <div className="text-xs text-gray-500 mt-1">Mitarbeiter</div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's staff */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Heutiger Dienstplan</h2>
            <button
              onClick={goToCalendar}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Zum Kalender →
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {state.employees.map(emp => {
              const shift = todayShifts.find(s => s.employeeId === emp.id);
              return (
                <div key={emp.id} className="flex items-center gap-3 px-4 py-3">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: emp.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 truncate">{emp.name}</div>
                    <div className="text-xs text-gray-500">{emp.role}</div>
                  </div>
                  {shift ? (
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[shift.status]}`}>
                        {STATUS_LABEL[shift.status]}
                      </span>
                      {shift.status === 'anwesend' && (
                        <span className="text-xs text-gray-500">
                          {shift.startTime}–{shift.endTime}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 italic">Kein Eintrag</span>
                  )}
                </div>
              );
            })}
            {state.employees.length === 0 && (
              <div className="px-4 py-8 text-center text-gray-400 text-sm">
                Noch keine Mitarbeiter angelegt.
              </div>
            )}
          </div>
        </div>

        {/* Week overview mini-grid */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Wochenübersicht</h2>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {WEEKDAY_NAMES.map(d => (
                <div key={d} className="text-center text-xs text-gray-400 font-medium">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((day) => {
                const ds = isoDate(day);
                const isToday = ds === today;
                const dayWarnings = getWarningsForDate(ds, state);
                const hasError = dayWarnings.some(w => w.severity === 'error');
                const presentCount = state.shifts.filter(s => s.date === ds && s.status === 'anwesend').length;
                const isHoliday = !!holidayMap[ds];
                return (
                  <button
                    key={ds}
                    onClick={() => {
                      dispatch({ type: 'SET_DATE', date: ds });
                      dispatch({ type: 'SET_PAGE', page: 'kalender' });
                      dispatch({ type: 'SET_VIEW', view: 'tag' });
                    }}
                    className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                      isToday
                        ? 'bg-blue-600 text-white'
                        : isHoliday
                        ? 'bg-amber-50 text-amber-700'
                        : 'hover:bg-gray-50 text-gray-700'
                    } ${hasError && !isToday ? 'ring-1 ring-red-400' : ''}`}
                  >
                    <span>{day.getDate()}</span>
                    {presentCount > 0 && (
                      <span className={`text-[9px] mt-0.5 ${isToday ? 'text-blue-100' : 'text-gray-400'}`}>
                        {presentCount}P
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Vacation overview */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Urlaubsübersicht {year}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-2 font-medium text-gray-600">Mitarbeiter</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Rolle</th>
                <th className="text-right px-4 py-2 font-medium text-gray-600">Anspruch</th>
                <th className="text-right px-4 py-2 font-medium text-gray-600">Genommen</th>
                <th className="text-right px-4 py-2 font-medium text-gray-600">Verbleibend</th>
                <th className="px-4 py-2 font-medium text-gray-600">Fortschritt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {vacationOverview.map(({ emp, used, total, remaining }) => {
                const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
                const isLow = remaining <= 5;
                return (
                  <tr key={emp.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: emp.color }} />
                        <span className="font-medium text-gray-900">{emp.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500">{emp.role}</td>
                    <td className="px-4 py-2.5 text-right text-gray-700">{total} Tage</td>
                    <td className="px-4 py-2.5 text-right text-gray-700">{used} Tage</td>
                    <td className={`px-4 py-2.5 text-right font-medium ${isLow ? 'text-red-600' : 'text-gray-700'}`}>
                      {remaining} Tage
                    </td>
                    <td className="px-4 py-2.5 min-w-[100px]">
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5 text-right">{pct}%</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {vacationOverview.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-400 text-sm">
              Noch keine Mitarbeiter angelegt.
            </div>
          )}
        </div>
      </div>

      {/* Monthly hour stats */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">
            Stunden {MONTH_NAMES[month]} {year}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-2 font-medium text-gray-600">Mitarbeiter</th>
                <th className="text-right px-4 py-2 font-medium text-gray-600">Ist-Std.</th>
                <th className="text-right px-4 py-2 font-medium text-gray-600">Soll-Std.</th>
                <th className="text-right px-4 py-2 font-medium text-gray-600">Differenz</th>
                <th className="text-right px-4 py-2 font-medium text-gray-600">Urlaub</th>
                <th className="text-right px-4 py-2 font-medium text-gray-600">Krank</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {monthStats.map(({ emp, stats }) => {
                if (!stats) return null;
                const actualH = (stats.actualMinutes / 60).toFixed(1);
                const contractH = (stats.contractedMinutes / 60).toFixed(1);
                const diffH = (stats.diffMinutes / 60).toFixed(1);
                const isNegative = stats.diffMinutes < 0;
                return (
                  <tr key={emp.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: emp.color }} />
                        <span className="font-medium text-gray-900">{emp.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-700">{actualH} h</td>
                    <td className="px-4 py-2.5 text-right text-gray-500">{contractH} h</td>
                    <td className={`px-4 py-2.5 text-right font-medium ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
                      {isNegative ? '' : '+'}{diffH} h
                    </td>
                    <td className="px-4 py-2.5 text-right text-blue-600">{stats.vacationDays}</td>
                    <td className="px-4 py-2.5 text-right text-red-500">{stats.sickDays}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {monthStats.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-400 text-sm">
              Noch keine Mitarbeiter angelegt.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
