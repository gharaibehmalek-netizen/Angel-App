
import { StoreProvider, useStore } from './store/StoreContext';
import { AppLayout } from './components/Layout/AppLayout';
import { PINScreen } from './components/PINScreen';

function AppInner() {
  const { state } = useStore();

  if (!state.settings.isUnlocked) {
    return <PINScreen />;
  }

  return <AppLayout />;
}

export default function App() {
  return (
    <StoreProvider>
      <AppInner />
    </StoreProvider>
  );
}
