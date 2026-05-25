
import { useStore } from '../../store/StoreContext';
import { WeekView } from './WeekView';
import { MonthView } from './MonthView';
import { DayView } from './DayView';

export function CalendarView() {
  const { state } = useStore();

  switch (state.currentView) {
    case 'woche': return <WeekView />;
    case 'monat': return <MonthView />;
    case 'tag': return <DayView />;
    default: return <WeekView />;
  }
}
