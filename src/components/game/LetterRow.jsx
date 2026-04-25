import React from 'react';

// Letter tiles for one word, highlighting positions where the letter already
// matches the target word at the same index (Wordle-style green tiles).
export default function LetterRow({ word, target }) {
  return (
    <div className="flex gap-1">
      {word.split('').map((ch, i) => {
        const matches = target && ch === target[i];
        return (
          <span
            key={i}
            className={`inline-flex w-8 h-8 items-center justify-center rounded font-mono font-bold text-sm uppercase ${
              matches ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-800'
            }`}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
}
