import { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { useStore } from '../../store/StoreContext';
import type { Employee, ShiftEntry, ShiftStatus } from '../../types';
import { parseDate, WEEKDAY_NAMES_LONG } from '../../utils/timeUtils';

interface ShiftModalProps {
  employee: Employee;
  date: string; // YYYY-MM-DD
  onClose: () => void;
}

const STATUS_OPTIONS: { value: ShiftStatus; label: string; color: string }[] = [
  { value: 'anwesend', label: 'Anwesend', color: 'bg-green-100 text-green-800 ring-green-300' },
  { value: 'urlaub', label: 'Urlaub', color: 'bg-blue-100 text-blue-800 ring-blue-300' },
  { value: 'krank', label: 'Krank', color: 'bg-red-100 text-red-800 ring-red-300' },
  { value: 'frei', label: 'Frei', color: 'bg-gray-100 text-gray-600 ring-gray-300' },
  { value: 'sonderurlaub', label: 'Sonderurlaub', color: 'bg-amber-100 text-amber-800 ring-amber-300' },
];

export function ShiftModal({ employee, date, onClose }: ShiftModalProps) {
  const { state, dispatch } = useStore();

  const existingShift = state.shifts.find(
    s => s.employeeId === employee.id && s.date === date
  );

  // Determine the day-of-week index (0=Mon..6=Sun)
  const dateObj = parseDate(date);
  const jsDay = dateObj.getDay(); // 0=Sun..6=Sat
  const dayIndex = jsDay === 0 ? 6 : jsDay - 1;
  const dayConfig = employee.workingDays[dayIndex];
  const dayName = WEEKDAY_NAMES_LONG[dayIndex];

  const [status, setStatus] = useState<ShiftStatus>(existingShift?.status ?? 'anwesend');
  const [startTime, setStartTime] = useState(
    existingShift?.startTime ?? dayConfig?.start ?? '08:00'
  );
  const [endTime, setEndTime] = useState(
    existingShift?.endTime ?? dayConfig?.end ?? '17:00'
  );
  const [breakMinutes, setBreakMinutes] = useState(
    existingShift?.breakMinutes ?? dayConfig?.breakMinutes ?? 30
  );
  const [notes, setNotes] = useState(existingShift?.notes ?? '');

  // When status changes to anwesend, pre-fill from workingDays config if no existing shift
  useEffect(() => {
    if (status === 'anwesend' && !existingShift) {
      if (dayConfig) {
        setStartTime(dayConfig.start);
        setEndTime(dayConfig.end);
        setBreakMinutes(dayConfig.breakMinutes);
      }
    }
  }, [status]);

  const handleSave = () => {
    const shift: ShiftEntry = {
      id: existingShift?.id ?? `s-${Date.now()}-${Math.random()}`,
      employeeId: employee.id,
      date,
      status,
      startTime: status === 'anwesend' ? startTime : '',
      endTime: status === 'anwesend' ? endTime : '',
      breakMinutes: status === 'anwesend' ? breakMinutes : 0,
      notes,
    };
    dispatch({ type: 'SET_SHIFT', shift });
    onClose();
  };

  const handleDelete = () => {
    if (existingShift) {
      dispatch({ type: 'DELETE_SHIFT', id: existingShift.id });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: employee.color }}
              />
              <h2 className="font-semibold text-gray-900">{employee.name}</h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5 ml-5">
              {dayName}, {dateObj.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Status selection */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setStatus(opt.value)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all border-2 ${
                    status === opt.value
                      ? `${opt.color} ring-2 border-transparent`
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time fields - only for anwesend */}
          {status === 'anwesend' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Beginn
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Ende
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Pause (Minuten)
                </label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  step="5"
                  value={breakMinutes}
                  onChange={e => setBreakMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Notiz (optional)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Interne Notiz..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 p-5 border-t border-gray-100">
          {existingShift && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Löschen
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
}
