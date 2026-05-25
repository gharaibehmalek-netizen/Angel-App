import { useState } from 'react';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import { useStore } from '../../store/StoreContext';
import type { Employee } from '../../types';
import { EmployeeModal } from './EmployeeModal';
import { getEmployeeMonthStats } from '../../utils/validation';
import { hoursLabel } from '../../utils/timeUtils';

export function EmployeesPage() {
  const { state, dispatch } = useStore();
  const [editEmployee, setEditEmployee] = useState<Employee | undefined>(undefined);
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const openNew = () => { setEditEmployee(undefined); setShowModal(true); };
  const openEdit = (emp: Employee) => { setEditEmployee(emp); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditEmployee(undefined); };

  const handleDelete = (id: string) => {
    dispatch({ type: 'DELETE_EMPLOYEE', id });
    setDeleteConfirm(null);
  };

  const groupedByRole = state.employees.reduce<Record<string, Employee[]>>((acc, emp) => {
    if (!acc[emp.role]) acc[emp.role] = [];
    acc[emp.role].push(emp);
    return acc;
  }, {});

  const roleOrder = ['Zahnärztin', 'ZFA', 'Empfang', 'Azubi'];

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mitarbeiter</h1>
          <p className="text-sm text-gray-500 mt-1">{state.employees.length} Mitarbeiter im Team</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Mitarbeiter hinzufügen
        </button>
      </div>

      {state.employees.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium text-gray-500">Noch keine Mitarbeiter</p>
          <p className="text-sm mt-1">Füge deinen ersten Mitarbeiter hinzu</p>
          <button onClick={openNew} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            Jetzt hinzufügen
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {roleOrder.filter(r => groupedByRole[r]).map(role => (
            <div key={role}>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{role}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {groupedByRole[role].map(emp => {
                  const stats = getEmployeeMonthStats(emp.id, year, month, state);
                  const vacUsed = state.shifts.filter(s =>
                    s.employeeId === emp.id && s.status === 'urlaub' &&
                    new Date(s.date + 'T00:00:00').getFullYear() === year
                  ).length;

                  return (
                    <div key={emp.id} className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-2 mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                            style={{ backgroundColor: emp.color }}
                          >
                            {emp.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 leading-tight">{emp.name}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{emp.role}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEdit(emp)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Bearbeiten"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {deleteConfirm === emp.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(emp.id)}
                                className="text-xs px-2 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700"
                              >
                                Ja, löschen
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-100 rounded-lg"
                              >
                                Abbrechen
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(emp.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                              title="Löschen"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-gray-50 rounded-xl p-2">
                          <div className="text-sm font-bold text-gray-900">{emp.contractedHoursPerWeek}h</div>
                          <div className="text-[10px] text-gray-400 mt-0.5">Std./Woche</div>
                        </div>
                        <div className="bg-blue-50 rounded-xl p-2">
                          <div className="text-sm font-bold text-blue-700">{vacUsed}/{emp.vacationDaysTotal}</div>
                          <div className="text-[10px] text-gray-400 mt-0.5">Urlaub</div>
                        </div>
                        <div className={`rounded-xl p-2 ${stats && stats.diffMinutes < 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                          <div className={`text-sm font-bold ${stats && stats.diffMinutes < 0 ? 'text-red-700' : 'text-green-700'}`}>
                            {stats ? hoursLabel(stats.actualMinutes) : '0 h'}
                          </div>
                          <div className="text-[10px] text-gray-400 mt-0.5">Ist/Monat</div>
                        </div>
                      </div>

                      {/* Working days badges */}
                      <div className="flex gap-1 mt-3">
                        {['Mo','Di','Mi','Do','Fr','Sa','So'].map((d, i) => (
                          <div
                            key={i}
                            className={`flex-1 text-center text-[9px] font-medium py-1 rounded ${
                              emp.workingDays[i]?.active
                                ? 'text-white'
                                : 'bg-gray-100 text-gray-300'
                            }`}
                            style={emp.workingDays[i]?.active ? { backgroundColor: emp.color + 'cc' } : {}}
                          >
                            {d}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <EmployeeModal employee={editEmployee} onClose={closeModal} />
      )}
    </div>
  );
}
