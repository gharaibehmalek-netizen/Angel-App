import { useState } from 'react';
import { useStore } from '../store/StoreContext';
import { Shield } from 'lucide-react';

export function PINScreen() {
  const { state, dispatch } = useStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleDigit = (d: string) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 4) {
      if (state.settings.pin === next) {
        dispatch({ type: 'UNLOCK', pin: next });
        setError('');
      } else {
        setError('Falsche PIN');
        setTimeout(() => { setPin(''); setError(''); }, 1000);
      }
    }
  };

  const handleDel = () => setPin(p => p.slice(0, -1));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-800">Dienstplaner</h1>
          <p className="text-sm text-gray-500 mt-1">Zahnarztpraxis Kranz & Kollegen</p>
        </div>

        <div className="flex justify-center gap-3 mb-6">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                i < pin.length
                  ? error ? 'bg-red-500 border-red-500' : 'bg-blue-600 border-blue-600'
                  : 'border-gray-300'
              }`}
            />
          ))}
        </div>

        {error && <p className="text-center text-red-500 text-sm mb-4">{error}</p>}

        <div className="grid grid-cols-3 gap-3">
          {['1','2','3','4','5','6','7','8','9'].map(d => (
            <button
              key={d}
              onClick={() => handleDigit(d)}
              className="h-14 text-xl font-semibold rounded-xl bg-gray-50 hover:bg-blue-50 active:bg-blue-100 text-gray-800 transition-colors border border-gray-200"
            >
              {d}
            </button>
          ))}
          <div />
          <button
            onClick={() => handleDigit('0')}
            className="h-14 text-xl font-semibold rounded-xl bg-gray-50 hover:bg-blue-50 active:bg-blue-100 text-gray-800 transition-colors border border-gray-200"
          >
            0
          </button>
          <button
            onClick={handleDel}
            className="h-14 text-xl font-semibold rounded-xl bg-gray-50 hover:bg-red-50 active:bg-red-100 text-gray-600 transition-colors border border-gray-200"
          >
            ⌫
          </button>
        </div>
      </div>
    </div>
  );
}
