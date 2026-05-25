import { createContext, useContext, useReducer, useEffect, type Dispatch, type ReactNode } from 'react';
import type { AppState } from '../types';
import { reducer } from './reducer';
import { INITIAL_STATE } from './initialState';
import { loadState, saveState } from '../utils/storage';
import type { Action } from './reducer';

interface StoreContextValue {
  state: AppState;
  dispatch: Dispatch<Action>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE, (initial) => {
    const saved = loadState();
    if (!saved) return initial;
    return {
      ...initial,
      ...saved,
      settings: { ...initial.settings, ...saved.settings, isUnlocked: saved.settings?.pin ? false : true },
      currentPage: 'dashboard' as const,
    };
  });

  useEffect(() => {
    saveState(state);
  }, [state]);

  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore outside StoreProvider');
  return ctx;
}
