
import { useStore } from '../../store/StoreContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { parseDate, isoDate, addDays, startOfWeek, MONTH_NAMES } from '../../utils/timeUtils';
import type { ViewMode } from '../../types';

const VIEW_LABELS: Record<ViewMode, string> = {
  monat: 'Monat',
  woche: 'Woche',
  tag: 'Tag',
};

export function Header() {
  const { state, dispatch } = useStore();

  const navigate = (dir: -1 | 1) => {
    const d = parseDate(state.currentDate);
    let next: Date;
    if (state.currentView === 'tag') {
      next = addDays(d, dir);
    } else if (state.currentView === 'woche') {
      next = addDays(d, dir * 7);
    } else {
      next = new Date(d.getFullYear(), d.getMonth() + dir, 1);
    }
    dispatch({ type: 'SET_DATE', date: isoDate(next) });
  };

  const goToday = () => dispatch({ type: 'SET_DATE', date: isoDate(new Date()) });

  const d = parseDate(state.currentDate);
  let title = '';
  if (state.currentView === 'monat') {
    title = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
  } else if (state.currentView === 'woche') {
    const mon = startOfWeek(d);
    const sun = addDays(mon, 6);
    if (mon.getMonth() === sun.getMonth()) {
      title = `${mon.getDate()}. – ${sun.getDate()}. ${MONTH_NAMES[mon.getMonth()]} ${mon.getFullYear()}`;
    } else {
      title = `${mon.getDate()}. ${MONTH_NAMES[mon.getMonth()]} – ${sun.getDate()}. ${MONTH_NAMES[sun.getMonth()]} ${sun.getFullYear()}`;
    }
  } else {
    title = `${d.getDate()}. ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
  }

  if (state.currentPage !== 'kalender') return null;

  return (
    <div className="flex items-center gap-2 p-3 bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="flex rounded-lg overflow-hidden border border-gray-200">
        {(['monat', 'woche', 'tag'] as ViewMode[]).map(v => (
          <button
            key={v}
            onClick={() => dispatch({ type: 'SET_VIEW', view: v })}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              state.currentView === v
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {VIEW_LABELS[v]}
          </button>
        ))}
      </div>
      <button
        onClick={goToday}
        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
      >
        Heute
      </button>
      <div className="flex items-center gap-1 ml-auto">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-gray-800 min-w-[180px] text-center">{title}</span>
        <button onClick={() => navigate(1)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
