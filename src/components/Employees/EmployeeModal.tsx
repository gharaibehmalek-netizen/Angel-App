import { useState } from 'react';
import { X } from 'lucide-react';
import { useStore } from '../../store/StoreContext';
import type { Employee, EmployeeRole, WorkingDayConfig } from '../../types';
import { WEEKDAY_NAMES_LONG } from '../../utils/timeUtils';

interface Props {
  employee?: Employee;
  onClose: () => void;
}

const ROLES: EmployeeRole[] = ['Zahnärztin', 'ZFA', 'Empfang', 'Azubi'];
const PRESET_COLORS = ['#2563eb', '#16a34a', '#9333ea', '#ea580c', '#0891b2', '#be185d', '#ca8a04', '#374151'];

const DEFAULT_WORKING_DAYS: Employee['workingDays'] = {
  0: { active: true, start: '08:00', end: '17:00', breakMinutes: 30 },
  1: { active: true, start: '08:00', end: '17:00', breakMinutes: 30 },
  2: { active: true, start: '08:00', end: '13:00', breakMinutes: 0 },
  3: { active: true, start: '08:00', end: '17:00', breakMinutes: 30 },
  4: { active: true, start: '08:00', end: '13:00', breakMinutes: 0 },
  5: { active: false, start: '08:00', end: '13:00', breakMinutes: 0 },
  6: { active: false, start: '08:00', end: '13:00', breakMinutes: 0 },
};

export function EmployeeModal({ employee, onClose }: Props) {
  const { dispatch } = useStore();
  const isNew = !employee;

  const [name, setName] = useState(employee?.name ?? '');
  const [role, setRole] = useState<EmployeeRole>(employee?.role ?? 'ZFA');
  const [hours, setHours] = useState(employee?.contractedHoursPerWeek ?? 38);
  const [vacationDays, setVacationDays] = useState(employee?.vacationDaysTotal ?? 28);
  const [color, setColor] = useState(employee?.color ?? PRESET_COLORS[0]);
  const [workingDays, setWorkingDays] = useState<Employee['workingDays']>(
    employee?.workingDays ?? DEFAULT_WORKING_DAYS
  );

  const updateDay = (idx: number, patch: Partial<WorkingDayConfig>) => {
    setWorkingDays(prev => ({ ...prev, [idx]: { ...prev[idx], ...patch } }));
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const emp: Employee = {
      id: employee?.id ?? `emp-${Date.now()}`,
      name: name.trim(),
      role,
      contractedHoursPerWeek: hours,
      vacationDaysTotal: vacationDays,
      color,
      workingDays,
    };
    dispatch({ type: isNew ? 'ADD_EMPLOYEE' : 'UPDATE_EMPLOYEE', employee: emp });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/40 backdrop-blur-sm overflow-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">{isNew ? 'Neuer Mitarbeiter' : 'Mitarbeiter bearbeiten'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="z.B. Dr. Maria Müller"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Role + hours */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Rolle</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as EmployeeRole)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Std./Woche</label>
              <input
                type="number"
                min={1}
                max={48}
                value={hours}
                onChange={e => setHours(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Urlaubstage</label>
              <input
                type="number"
                min={0}
                max={60}
                value={vacationDays}
                onChange={e => setVacationDays(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Farbe</label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${color === c ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="w-8 h-8 rounded-full cursor-pointer border-0 p-0"
                title="Benutzerdefinierte Farbe"
              />
            </div>
          </div>

          {/* Working days */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Arbeitszeiten (Standardplan)</label>
            <div className="space-y-2">
              {WEEKDAY_NAMES_LONG.map((dayName, idx) => {
                const day = workingDays[idx];
                return (
                  <div key={idx} className="flex items-center gap-2">
                    <button
                      onClick={() => updateDay(idx, { active: !day.active })}
                      className={`w-20 text-xs font-medium px-2 py-1.5 rounded-lg border transition-colors ${
                        day.active
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-gray-50 text-gray-400 border-gray-200'
                      }`}
                    >
                      {dayName.slice(0, 2)}
                    </button>
                    {day.active ? (
                      <>
                        <input
                          type="time"
                          value={day.start}
                          onChange={e => updateDay(idx, { start: e.target.value })}
                          className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <span className="text-gray-400 text-xs">–</span>
                        <input
                          type="time"
                          value={day.end}
                          onChange={e => updateDay(idx, { end: e.target.value })}
                          className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                          type="number"
                          min={0}
                          step={5}
                          value={day.breakMinutes}
                          onChange={e => updateDay(idx, { breakMinutes: Number(e.target.value) })}
                          className="w-16 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Pause"
                          title="Pause in Minuten"
                        />
                        <span className="text-xs text-gray-400 w-6">Min</span>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400 ml-2">Frei</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isNew ? 'Hinzufügen' : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  );
}
