import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flame, Trophy, Target } from 'lucide-react';
import { loadStats, recentDailyHistory } from '../services/stats';

function Stat({ value, label }) {
  return (
    <div className="text-center">
      <div className="text-4xl font-black text-gray-900">{value}</div>
      <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mt-1">{label}</div>
    </div>
  );
}

export default function StatsModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  const stats = loadStats();
  const winPct = stats.lifetimeGames > 0
    ? Math.round((stats.lifetimeWins / stats.lifetimeGames) * 100)
    : 0;
  const avgMoves = stats.lifetimeWins > 0
    ? (stats.totalMoves / stats.lifetimeWins).toFixed(1)
    : '—';
  const recent = recentDailyHistory(7);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl shadow-2xl max-w-md w-full border-2 border-gray-200"
        >
          <div className="flex items-center justify-between border-b-2 border-gray-200 p-6">
            <h2 className="text-2xl font-black text-gray-900">📊 Statistics</h2>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-4 gap-2">
              <Stat value={stats.lifetimeGames} label="Played" />
              <Stat value={`${winPct}%`} label="Win %" />
              <Stat value={stats.dailyStreak} label="Streak" />
              <Stat value={stats.longestStreak} label="Best" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4 text-center">
                <Trophy className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
                <div className="text-2xl font-bold text-emerald-900">{stats.lifetimeWins}</div>
                <div className="text-xs font-semibold text-emerald-700 uppercase">Wins</div>
              </div>
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 text-center">
                <Target className="w-5 h-5 mx-auto text-blue-600 mb-1" />
                <div className="text-2xl font-bold text-blue-900">{avgMoves}</div>
                <div className="text-xs font-semibold text-blue-700 uppercase">Avg moves</div>
              </div>
            </div>

            <div>
              <div className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <Flame className="w-4 h-4" />
                Last 7 daily puzzles
              </div>
              {recent.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-6 bg-gray-50 rounded-xl">
                  No daily puzzles played yet.
                </div>
              ) : (
                <div className="flex items-end gap-2 h-24">
                  {recent.map(h => (
                    <div key={h.date} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className={`w-full rounded-t ${h.won ? 'bg-emerald-500' : 'bg-gray-300'}`}
                        style={{ height: `${Math.max(8, (h.moves || 5) * 18)}px` }}
                        title={`${h.date}: ${h.won ? `won in ${h.moves}` : 'lost'}`}
                      />
                      <div className="text-[10px] text-gray-500 font-mono">{h.date.slice(5)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
