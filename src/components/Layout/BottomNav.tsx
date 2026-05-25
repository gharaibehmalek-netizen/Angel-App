import React from 'react';
import { useStore } from '../../store/StoreContext';
import type { NavPage } from '../../types';
import { LayoutDashboard, Calendar, Users, Settings, Download } from 'lucide-react';

const NAV_ITEMS: { page: NavPage; label: string; icon: React.ReactNode }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { page: 'kalender', label: 'Kalender', icon: <Calendar className="w-5 h-5" /> },
  { page: 'mitarbeiter', label: 'Team', icon: <Users className="w-5 h-5" /> },
  { page: 'einstellungen', label: 'Einst.', icon: <Settings className="w-5 h-5" /> },
  { page: 'export', label: 'Export', icon: <Download className="w-5 h-5" /> },
];

export function BottomNav() {
  const { state, dispatch } = useStore();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
      <div className="flex">
        {NAV_ITEMS.map(item => (
          <button
            key={item.page}
            onClick={() => dispatch({ type: 'SET_PAGE', page: item.page })}
            className={`flex-1 flex flex-col items-center py-2 px-1 text-xs transition-colors ${
              state.currentPage === item.page
                ? 'text-blue-600'
                : 'text-gray-500'
            }`}
          >
            {item.icon}
            <span className="mt-0.5">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
