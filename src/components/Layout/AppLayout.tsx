
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { Header } from './Header';
import { Dashboard } from '../Dashboard/Dashboard';
import { CalendarView } from '../Calendar/CalendarView';
import { EmployeesPage } from '../Employees/EmployeesPage';
import { SettingsPage } from '../Settings/SettingsPage';
import { ExportPage } from '../Export/ExportPage';
import { useStore } from '../../store/StoreContext';

export function AppLayout() {
  const { state } = useStore();

  const renderPage = () => {
    switch (state.currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'kalender': return <CalendarView />;
      case 'mitarbeiter': return <EmployeesPage />;
      case 'einstellungen': return <SettingsPage />;
      case 'export': return <ExportPage />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 pb-20 lg:pb-0 overflow-auto">
          {renderPage()}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
