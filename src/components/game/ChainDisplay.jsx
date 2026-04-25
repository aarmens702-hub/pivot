import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, BookOpen, Loader2 } from 'lucide-react';
import LetterRow from './LetterRow';

// Vertical list of words played so far, showing the move type (letter-change
// vs synonym) between each step and a definition for each word.
export default function ChainDisplay({ chain, definitions, moveTypes, target }) {
  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {chain.map((word, index) => {
          const def = definitions.get(word);
          const moveType = index > 0 ? moveTypes[index - 1] : null;
          return (
            <motion.div
              key={`${word}-${index}`}
              initial={{ opacity: 0, y: 40, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -60, scale: 0.85, rotate: -2 }}
              transition={{ type: 'spring', damping: 14, stiffness: 220, mass: 0.8 }}
              className="relative"
            >
              {index > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.12, type: 'spring', damping: 18, stiffness: 260 }}
                  className="flex items-center gap-2 mb-2 ml-4"
                >
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    moveType === 'synonym'
                      ? 'bg-purple-100 text-purple-700 border border-purple-200'
                      : 'bg-blue-100 text-blue-700 border border-blue-200'
                  }`}>
                    {moveType === 'synonym' ? '🔄 Synonym swap' : '✏️ Letter change'}
                  </span>
                </motion.div>
              )}

              <motion.div whileHover={{ scale: 1.01 }} className="group relative bg-white border-2 border-gray-200 rounded-2xl p-5 hover:border-gray-300 hover:shadow-xl transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-900 to-gray-700 text-white flex items-center justify-center text-sm font-bold shadow-lg">
                        {index + 1}
                      </div>
                      <div className="text-3xl font-black text-gray-900 tracking-tight">{word.toUpperCase()}</div>
                      <LetterRow word={word} target={target} />
                    </div>

                    {def?.meanings?.[0] ? (
                      <div className="ml-11 space-y-2">
                        <div className="flex items-start gap-2">
                          <BookOpen className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="text-sm text-gray-700 leading-relaxed">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-800 mr-2">
                                {def.meanings[0].partOfSpeech}
                              </span>
                              <span className="font-medium">{def.meanings[0].definitions[0].definition}</span>
                            </div>
                            {def.meanings[0].definitions[0].example && (
                              <div className="text-sm text-gray-600 italic mt-2 pl-3 border-l-2 border-gray-200">
                                "{def.meanings[0].definitions[0].example}"
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="ml-11 flex items-center gap-2 text-sm text-gray-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading definition...
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
