import React from 'react';
import { Delete, CornerDownLeft } from 'lucide-react';

const ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['enter', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'back'],
];

// On-screen keyboard for mobile / touch devices. Hidden on md+ screens via
// the `md:hidden` wrapper in PivotGame so desktop users keep their physical
// keyboard.
export default function Keyboard({ onKey, onSubmit, onBackspace, disabled }) {
  const press = (k) => {
    if (disabled) return;
    if (k === 'enter') onSubmit();
    else if (k === 'back') onBackspace();
    else onKey(k);
  };

  return (
    <div className="md:hidden mt-4 space-y-2">
      {ROWS.map((row, ri) => (
        <div key={ri} className="flex justify-center gap-1">
          {row.map(k => {
            const isAction = k === 'enter' || k === 'back';
            return (
              <button
                key={k}
                onClick={() => press(k)}
                disabled={disabled}
                className={`${
                  isAction ? 'px-3 text-xs font-bold flex-[1.5]' : 'flex-1 text-base font-semibold'
                } h-12 bg-gray-200 hover:bg-gray-300 active:bg-gray-400 rounded-md uppercase text-gray-900 disabled:opacity-50 transition-colors flex items-center justify-center`}
              >
                {k === 'enter' ? <CornerDownLeft className="w-4 h-4" /> :
                 k === 'back' ? <Delete className="w-4 h-4" /> : k}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
