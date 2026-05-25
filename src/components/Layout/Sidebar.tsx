import React from 'react';
import { useStore } from '../../store/StoreContext';
import type { NavPage } from '../../types';
import {
  LayoutDashboard, Calendar, Users, Settings, Download, Lock, Stethoscope
} from 'lucide-react';

const NAV_ITEMS: { page: NavPage; label: string; icon: React.ReactNode }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { page: 'kalender', label: 'Kalender', icon: <Calendar className="w-5 h-5" /> },
  { page: 'mitarbeiter', label: 'Mitarbeiter', icon: <Users className="w-5 h-5" /> },
  { page: 'einstellungen', label: 'Einstellungen', icon: <Settings className="w-5 h-5" /> },
  { page: 'export', label: 'Export & Druck', icon: <Download className="w-5 h-5" /> },
];

export function Sidebar() {
  const { state, dispatch } = useStore();

  return (
    <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-gray-200 h-screen sticky top-0">
      <div className="p-5 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-gray-900 text-sm leading-tight">Dienstplaner</div>
            <div className="text-xs text-gray-500 leading-tight">Zahnarztpraxis Kranz</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map(item => (
          <button
            key={item.page}
            onClick={() => dispatch({ type: 'SET_PAGE', page: item.page })}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              state.currentPage === item.page
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-200">
        {state.settings.pin && (
          <button
            onClick={() => dispatch({ type: 'LOCK' })}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <Lock className="w-5 h-5" />
            Sperren
          </button>
        )}
        <p className="text-xs text-gray-400 mt-2 px-3">{state.settings.practiceAddress}</p>
      </div>
    </aside>
  );
}
