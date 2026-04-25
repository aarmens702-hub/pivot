import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

// Start / target word card. The target variant gets the green theme and a
// "Par N" badge showing the BFS shortest-path distance from start.
export default function WordCard({ word, definition, label, isTarget, par }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-3xl border-2 p-6 ${
        isTarget
          ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200'
          : 'bg-gradient-to-br from-slate-50 to-gray-50 border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-semibold tracking-wider uppercase text-gray-500">{label}</div>
        {isTarget && par != null && (
          <div className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
            Par {par}
          </div>
        )}
      </div>
      <div className={`text-5xl font-bold mb-3 ${isTarget ? 'text-emerald-900' : 'text-gray-900'}`}>
        {word.toUpperCase()}
      </div>
      {definition?.meanings?.[0]?.definitions?.[0] && (
        <div className="space-y-2">
          <div className="text-sm text-gray-700 leading-relaxed">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-200 text-gray-800 mr-2">
              {definition.meanings[0].partOfSpeech}
            </span>
            <span className="font-medium">
              {definition.meanings[0].definitions[0].definition}
            </span>
          </div>
          {definition.meanings[0].definitions[0].example && (
            <div className="text-sm text-gray-600 italic pl-3 border-l-2 border-gray-300">
              "{definition.meanings[0].definitions[0].example}"
            </div>
          )}
        </div>
      )}
      {!definition && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading definition...
        </div>
      )}
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 ${
        isTarget ? 'bg-emerald-400' : 'bg-gray-400'
      }`} />
    </motion.div>
  );
}
