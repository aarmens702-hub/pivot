import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Target, Zap, Award } from 'lucide-react';
import ShareCard from '../ShareCard';
import { CLEAR_BONUS, unusedMovesBonus } from '../../constants';

// End-of-game screen — three states distinguished by `won` and `gaveUp`:
//   won=true            : trophy + score breakdown + share button
//   won=false, gaveUp=t : white-flag, shows the optimal solution we fetched
//   won=false, gaveUp=f : ran out of moves, shows the chain so far
export default function GameOver({ won, score, chain, moveTypes, movesLeft, targetWord, parDistance, mode, solution, onPlayAgain, gaveUp }) {
  const letterMoves = moveTypes.filter(t => t === 'letter').length;
  const synonymMoves = moveTypes.filter(t => t === 'synonym').length;
  const unusedBonus = unusedMovesBonus(movesLeft);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6">
      {won ? (
        <>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 10, stiffness: 200, delay: 0.2 }}
            className="inline-flex w-24 h-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-2xl"
          >
            <Trophy className="w-12 h-12" />
          </motion.div>

          <div>
            <h2 className="text-5xl font-black text-gray-900 mb-2">Brilliant!</h2>
            <p className="text-xl text-gray-600 font-medium">
              You solved it in {chain.length - 1} moves {parDistance != null && <span className="text-gray-400">(par {parDistance})</span>}
            </p>
          </div>

          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 }} className="inline-block">
            <div className="text-7xl font-black text-gray-900">{score}</div>
            <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Score</div>
          </motion.div>

          <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 space-y-3 border-2 border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-gray-700 font-medium"><Zap className="w-4 h-4" />Letter changes</span>
              <span className="font-bold text-gray-900">+{letterMoves}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-gray-700 font-medium"><Target className="w-4 h-4" />Synonym swaps</span>
              <span className="font-bold text-gray-900">+{synonymMoves * 2}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-gray-700 font-medium"><Award className="w-4 h-4" />Unused moves</span>
              <span className="font-bold text-gray-900">+{unusedBonus}</span>
            </div>
            <div className="pt-3 border-t-2 border-gray-200 flex items-center justify-between">
              <span className="text-sm font-bold text-gray-700">Clear bonus</span>
              <span className="font-bold text-gray-900">+{CLEAR_BONUS}</span>
            </div>
          </div>

          <ShareCard chain={chain} target={targetWord} moves={chain.length - 1} parDistance={parDistance} mode={mode} />
        </>
      ) : (
        <>
          <div className="inline-flex w-24 h-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white text-5xl shadow-2xl">
            {gaveUp ? '🏳️' : '💭'}
          </div>

          <div>
            <h2 className="text-5xl font-black text-gray-900 mb-2">{gaveUp ? 'No worries.' : 'So Close!'}</h2>
            <p className="text-xl text-gray-600 font-medium">
              The target was <span className="font-bold text-orange-600">{targetWord.toUpperCase()}</span>
            </p>
          </div>

          {chain.length > 1 && (
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border-2 border-gray-200">
              <div className="text-sm text-gray-600 mb-2 font-semibold">Your chain</div>
              <div className="text-lg font-bold text-gray-900">{chain.join(' → ').toUpperCase()}</div>
            </div>
          )}

          {solution && (
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border-2 border-emerald-200">
              <div className="text-sm text-emerald-800 mb-2 font-semibold">Optimal solution</div>
              <div className="text-lg font-bold text-emerald-900">{solution.join(' → ').toUpperCase()}</div>
              <div className="text-xs text-emerald-700 mt-2">{solution.length - 1} moves</div>
            </div>
          )}
        </>
      )}

      <button
        onClick={onPlayAgain}
        className="w-full px-8 py-4 bg-gradient-to-r from-gray-900 to-gray-700 text-white font-bold text-lg rounded-xl hover:from-gray-800 hover:to-gray-600 active:scale-95 transition-all shadow-lg"
      >
        Play Again
      </button>
    </motion.div>
  );
}
