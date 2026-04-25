import React, { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { buildShareString } from './share-string';

export default function ShareCard({ chain, target, moves, parDistance, mode }) {
  const [copied, setCopied] = useState(false);

  const onClick = async () => {
    const text = buildShareString({ chain, target, moves, parDistance, mode });
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('clipboard failed', err);
    }
  };

  return (
    <button
      onClick={onClick}
      className="w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 active:scale-95 transition-all flex items-center justify-center gap-2"
    >
      {copied ? (
        <>
          <Check className="w-5 h-5" />
          Copied to clipboard!
        </>
      ) : (
        <>
          <Share2 className="w-5 h-5" />
          Share result
        </>
      )}
    </button>
  );
}
