import { useState } from 'react';
import { Save, Lock, Unlock, Eye, EyeOff, Clock, Building2 } from 'lucide-react';
import { useStore } from '../../store/StoreContext';
import type { PracticeHoursDay } from '../../types';
import { WEEKDAY_NAMES_LONG } from '../../utils/timeUtils';

export function SettingsPage() {
  const { state, dispatch } = useStore();
  const { settings, practiceHours } = state;

  const [practiceName, setPracticeName] = useState(settings.practiceName);
  const [practiceAddress, setPracticeAddress] = useState(settings.practiceAddress);
  const [minDentists, setMinDentists] = useState(settings.minDentists);
  const [minZFA, setMinZFA] = useState(settings.minZFA);

  const [pinMode, setPinMode] = useState<'none' | 'set' | 'change' | 'remove'>('none');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState('');
  const [saved, setSaved] = useState(false);

  const [hours, setHours] = useState<typeof practiceHours>(practiceHours);

  const saveGeneral = () => {
    dispatch({ type: 'UPDATE_SETTINGS', settings: { practiceName, practiceAddress, minDentists, minZFA } });
    dispatch({ type: 'UPDATE_PRACTICE_HOURS', hours });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSetPin = () => {
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setPinError('PIN muss genau 4 Ziffern sein');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('PINs stimmen nicht überein');
      return;
    }
    dispatch({ type: 'SET_PIN', pin: newPin });
    setPinMode('none');
    setNewPin('');
    setConfirmPin('');
    setPinError('');
  };

  const handleRemovePin = () => {
    dispatch({ type: 'SET_PIN', pin: null });
    setPinMode('none');
  };

  const updateHoursDay = (idx: number, patch: Partial<PracticeHoursDay>) => {
    setHours(prev => ({ ...prev, [idx]: { ...prev[idx], ...patch } }));
  };

  const updateSlot = (idx: number, slot: 'morning' | 'afternoon', field: 'start' | 'end', value: string) => {
    setHours(prev => ({
      ...prev,
      [idx]: {
        ...prev[idx],
        [slot]: { ...(prev[idx][slot] ?? { start: '08:00', end: '13:00' }), [field]: value },
      },
    }));
  };

  const toggleAfternoon = (idx: number) => {
    const day = hours[idx];
    if (day.afternoon) {
      const { afternoon: _, ...rest } = day;
      setHours(prev => ({ ...prev, [idx]: rest }));
    } else {
      setHours(prev => ({ ...prev, [idx]: { ...prev[idx], afternoon: { start: '14:00', end: '18:00' } } }));
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Einstellungen</h1>

      {/* General settings */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-gray-900">Praxisdaten</h2>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Praxisname</label>
          <input
            type="text"
            value={practiceName}
            onChange={e => setPracticeName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Adresse</label>
          <input
            type="text"
            value={practiceAddress}
            onChange={e => setPracticeAddress(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Min. Zahnärztinnen/Tag
            </label>
            <input
              type="number"
              min={0}
              max={10}
              value={minDentists}
              onChange={e => setMinDentists(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Min. ZFA/Tag
            </label>
            <input
              type="number"
              min={0}
              max={10}
              value={minZFA}
              onChange={e => setMinZFA(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Opening hours */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-5">
          <Clock className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-gray-900">Öffnungszeiten</h2>
        </div>

        <div className="space-y-3">
          {WEEKDAY_NAMES_LONG.map((dayName, idx) => {
            const day = hours[idx];
            return (
              <div key={idx} className={`rounded-xl border p-3 ${day.closed ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateHoursDay(idx, { closed: !day.closed })}
                    className={`w-24 text-xs font-semibold py-1.5 rounded-lg border transition-colors ${
                      !day.closed ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-400 border-gray-200'
                    }`}
                  >
                    {dayName.slice(0, 2)}
                  </button>

                  {day.closed ? (
                    <span className="text-xs text-gray-400 italic">Geschlossen</span>
                  ) : (
                    <div className="flex-1 space-y-2">
                      {/* Morning slot */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 w-16">Vormittag</span>
                        <input
                          type="time"
                          value={day.morning?.start ?? '08:00'}
                          onChange={e => updateSlot(idx, 'morning', 'start', e.target.value)}
                          className="px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 w-24"
                        />
                        <span className="text-gray-300 text-xs">–</span>
                        <input
                          type="time"
                          value={day.morning?.end ?? '13:00'}
                          onChange={e => updateSlot(idx, 'morning', 'end', e.target.value)}
                          className="px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 w-24"
                        />
                      </div>

                      {/* Afternoon slot */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleAfternoon(idx)}
                          className={`text-xs w-16 py-0.5 rounded border transition-colors ${
                            day.afternoon ? 'bg-blue-50 text-blue-600 border-blue-200' : 'text-gray-400 border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          {day.afternoon ? 'Nachmittag' : '+ Nachmittag'}
                        </button>
                        {day.afternoon && (
                          <>
                            <input
                              type="time"
                              value={day.afternoon.start}
                              onChange={e => updateSlot(idx, 'afternoon', 'start', e.target.value)}
                              className="px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 w-24"
                            />
                            <span className="text-gray-300 text-xs">–</span>
                            <input
                              type="time"
                              value={day.afternoon.end}
                              onChange={e => updateSlot(idx, 'afternoon', 'end', e.target.value)}
                              className="px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 w-24"
                            />
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={saveGeneral}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
          saved ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        <Save className="w-4 h-4" />
        {saved ? 'Gespeichert!' : 'Einstellungen speichern'}
      </button>

      {/* PIN management */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-gray-900">Zugangssicherung</h2>
        </div>

        {settings.pin ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-green-50 rounded-xl p-3 border border-green-200">
              <Lock className="w-4 h-4 text-green-600" />
              PIN-Schutz ist aktiv. Die App wird beim Öffnen gesperrt.
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPinMode('change')}
                className="flex-1 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-700"
              >
                PIN ändern
              </button>
              <button
                onClick={handleRemovePin}
                className="flex-1 py-2 text-sm border border-red-200 rounded-xl hover:bg-red-50 transition-colors text-red-600"
              >
                PIN entfernen
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-xl p-3">
              <Unlock className="w-4 h-4" />
              Kein PIN-Schutz aktiv.
            </div>
            <button
              onClick={() => setPinMode('set')}
              className="w-full py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              PIN einrichten
            </button>
          </div>
        )}

        {(pinMode === 'set' || pinMode === 'change') && (
          <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Neue PIN (4 Ziffern)
              </label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={4}
                  value={newPin}
                  onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                  placeholder="****"
                />
                <button
                  onClick={() => setShowPin(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                PIN bestätigen
              </label>
              <input
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                maxLength={4}
                value={confirmPin}
                onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="****"
              />
            </div>
            {pinError && <p className="text-xs text-red-600">{pinError}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => { setPinMode('none'); setNewPin(''); setConfirmPin(''); setPinError(''); }}
                className="flex-1 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-600"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSetPin}
                className="flex-1 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
              >
                PIN speichern
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
