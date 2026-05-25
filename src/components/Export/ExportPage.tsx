import { useRef, useState } from 'react';
import { Download, Upload, Printer, Copy, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { useStore } from '../../store/StoreContext';
import { exportBackup, importBackup } from '../../utils/storage';
import {
  isoDate, startOfWeek, MONTH_NAMES, hoursLabel
} from '../../utils/timeUtils';
import { getEmployeeMonthStats } from '../../utils/validation';


export function ExportPage() {
  const { state, dispatch } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // Copy week template state
  const [sourceWeek, setSourceWeek] = useState(isoDate(startOfWeek(now)));
  const [targetWeek, setTargetWeek] = useState('');
  const [copiedWeek, setCopiedWeek] = useState(false);

  // Copy month template state
  const [sourceMonth, setSourceMonth] = useState(`${year}-${String(month + 1).padStart(2, '0')}`);
  const [targetMonth, setTargetMonth] = useState('');
  const [copiedMonth, setCopiedMonth] = useState(false);

  const handleImport = async (file: File) => {
    try {
      setImportError('');
      const data = await importBackup(file);
      dispatch({ type: 'IMPORT_STATE', state: data });
      setImportSuccess(true);
      setTimeout(() => setImportSuccess(false), 3000);
    } catch (e) {
      setImportError((e as Error).message);
    }
  };

  const handleCopyWeek = () => {
    if (!targetWeek) return;
    dispatch({ type: 'COPY_WEEK_TEMPLATE', sourceWeekStart: sourceWeek, targetWeekStart: targetWeek });
    setCopiedWeek(true);
    setTimeout(() => setCopiedWeek(false), 2000);
  };

  const handleCopyMonth = () => {
    if (!targetMonth) return;
    dispatch({ type: 'COPY_MONTH_TEMPLATE', sourceYearMonth: sourceMonth, targetYearMonth: targetMonth });
    setCopiedMonth(true);
    setTimeout(() => setCopiedMonth(false), 2000);
  };

  // Monthly stats table for print
  const monthStats = state.employees.map(emp => ({
    emp,
    stats: getEmployeeMonthStats(emp.id, year, month, state),
  }));

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Export & Druck</h1>

      {/* Print */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Printer className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-gray-900">Drucken</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Druckt die aktuelle Ansicht (Wochenplan / Monatsübersicht) als PDF. Wechsle vorher im Kalender zur gewünschten Ansicht.
        </p>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Printer className="w-4 h-4" />
          Jetzt drucken
        </button>
      </div>

      {/* Month stats table */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileSpreadsheet className="w-5 h-5 text-green-600" />
          <h2 className="font-semibold text-gray-900">Monatsauswertung {MONTH_NAMES[month]} {year}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-3 py-2 border border-gray-200 font-medium text-gray-600">Mitarbeiter</th>
                <th className="text-left px-3 py-2 border border-gray-200 font-medium text-gray-600">Rolle</th>
                <th className="text-right px-3 py-2 border border-gray-200 font-medium text-gray-600">Ist-Std.</th>
                <th className="text-right px-3 py-2 border border-gray-200 font-medium text-gray-600">Soll-Std.</th>
                <th className="text-right px-3 py-2 border border-gray-200 font-medium text-gray-600">Differenz</th>
                <th className="text-right px-3 py-2 border border-gray-200 font-medium text-gray-600">Urlaub</th>
                <th className="text-right px-3 py-2 border border-gray-200 font-medium text-gray-600">Krank</th>
              </tr>
            </thead>
            <tbody>
              {monthStats.map(({ emp, stats }) => {
                if (!stats) return null;
                return (
                  <tr key={emp.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 border border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: emp.color }} />
                        {emp.name}
                      </div>
                    </td>
                    <td className="px-3 py-2 border border-gray-100 text-gray-500">{emp.role}</td>
                    <td className="px-3 py-2 border border-gray-100 text-right">{hoursLabel(stats.actualMinutes)}</td>
                    <td className="px-3 py-2 border border-gray-100 text-right text-gray-400">{hoursLabel(stats.contractedMinutes)}</td>
                    <td className={`px-3 py-2 border border-gray-100 text-right font-medium ${stats.diffMinutes < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {stats.diffMinutes >= 0 ? '+' : ''}{hoursLabel(stats.diffMinutes)}
                    </td>
                    <td className="px-3 py-2 border border-gray-100 text-right text-blue-600">{stats.vacationDays}</td>
                    <td className="px-3 py-2 border border-gray-100 text-right text-red-500">{stats.sickDays}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Copy week template */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Copy className="w-5 h-5 text-purple-600" />
          <h2 className="font-semibold text-gray-900">Wochenplan kopieren</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">Kopiert alle Schichteinträge einer Woche auf eine andere Woche (vorhandene Einträge werden nicht überschrieben).</p>
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Quellwoche (Montag)</label>
            <input
              type="date"
              value={sourceWeek}
              onChange={e => setSourceWeek(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <span className="text-gray-400 mt-5">→</span>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Zielwoche (Montag)</label>
            <input
              type="date"
              value={targetWeek}
              onChange={e => setTargetWeek(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleCopyWeek}
            disabled={!targetWeek}
            className={`mt-5 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50 ${
              copiedWeek ? 'bg-green-600 text-white' : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            {copiedWeek ? 'Kopiert!' : 'Woche kopieren'}
          </button>
        </div>
      </div>

      {/* Copy month template */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Copy className="w-5 h-5 text-indigo-600" />
          <h2 className="font-semibold text-gray-900">Monatsplan kopieren</h2>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Quellmonat</label>
            <input
              type="month"
              value={sourceMonth}
              onChange={e => setSourceMonth(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <span className="text-gray-400 mt-5">→</span>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Zielmonat</label>
            <input
              type="month"
              value={targetMonth}
              onChange={e => setTargetMonth(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleCopyMonth}
            disabled={!targetMonth}
            className={`mt-5 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50 ${
              copiedMonth ? 'bg-green-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {copiedMonth ? 'Kopiert!' : 'Monat kopieren'}
          </button>
        </div>
      </div>

      {/* Backup / Restore */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Download className="w-5 h-5 text-gray-600" />
          <h2 className="font-semibold text-gray-900">Datensicherung</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-medium text-gray-800 mb-2">Backup herunterladen</h3>
            <p className="text-xs text-gray-500 mb-3">Alle Daten als JSON-Datei exportieren.</p>
            <button
              onClick={() => exportBackup(state)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-900 transition-colors"
            >
              <Download className="w-4 h-4" />
              Backup herunterladen
            </button>
          </div>
          <div className="border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-medium text-gray-800 mb-2">Backup wiederherstellen</h3>
            <p className="text-xs text-gray-500 mb-3">JSON-Backup-Datei importieren. Überschreibt alle aktuellen Daten!</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Datei auswählen
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={e => e.target.files?.[0] && handleImport(e.target.files[0])}
            />
            {importError && (
              <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
                <AlertCircle className="w-3 h-3" />
                {importError}
              </div>
            )}
            {importSuccess && (
              <div className="mt-2 text-xs text-green-600 font-medium">Backup erfolgreich wiederhergestellt!</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
