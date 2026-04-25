import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Calendar, Shuffle, Sparkles as SparklesIcon, ArrowLeft } from 'lucide-react';
import StatsModal from './components/StatsModal';

function ModeButton({ icon: Icon, label, sub, onClick, accent }) {
  const accentClasses = {
    emerald: 'bg-emerald-50 border-emerald-300 hover:bg-emerald-100 text-emerald-900',
    gray: 'bg-white border-gray-300 hover:bg-gray-50 text-gray-900',
    purple: 'bg-purple-50 border-purple-300 hover:bg-purple-100 text-purple-900',
  };
  return (
    <button onClick={onClick} className={`w-full p-4 border-2 rounded-2xl text-left transition-all active:scale-95 ${accentClasses[accent] || accentClasses.gray}`}>
      <div className="flex items-center gap-3">
        <Icon className="w-6 h-6 flex-shrink-0" />
        <div className="flex-1">
          <div className="font-bold text-lg">{label}</div>
          {sub && <div className="text-sm opacity-70">{sub}</div>}
        </div>
      </div>
    </button>
  );
}

export default function MenuPage({ onSelect, onBack }) {
  const [showStats, setShowStats] = useState(false);

  return (
    <>
      <div className="min-h-screen bg-white flex flex-col items-center p-4">
        <div className="w-full max-w-md mt-8">
          <button onClick={onBack} className="mb-6 text-gray-500 hover:text-gray-900 font-medium flex items-center gap-2 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <h1 className="text-5xl font-black text-gray-900 tracking-tight" style={{ fontFamily: 'ui-rounded, system-ui, -apple-system, sans-serif' }}>
              Pick a puzzle
            </h1>
            <p className="text-gray-500 mt-2">Choose how you want to play today</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-3">
            <ModeButton icon={Calendar} label="Today's Puzzle" sub="Same puzzle for everyone, every day" accent="emerald" onClick={() => onSelect({ type: 'daily' })} />
            <ModeButton icon={Shuffle} label="Random Puzzle" sub="A new ladder every time" accent="gray" onClick={() => onSelect({ type: 'random' })} />

            <div className="grid grid-cols-3 gap-2 pt-2">
              <button onClick={() => onSelect({ type: 'difficulty', difficulty: 'easy' })} className="p-3 bg-green-50 border-2 border-green-300 rounded-xl font-bold text-green-900 hover:bg-green-100 active:scale-95 transition-all">
                Easy<div className="text-xs font-normal opacity-70">par 3</div>
              </button>
              <button onClick={() => onSelect({ type: 'difficulty', difficulty: 'medium' })} className="p-3 bg-yellow-50 border-2 border-yellow-300 rounded-xl font-bold text-yellow-900 hover:bg-yellow-100 active:scale-95 transition-all">
                Medium<div className="text-xs font-normal opacity-70">par 4</div>
              </button>
              <button onClick={() => onSelect({ type: 'difficulty', difficulty: 'hard' })} className="p-3 bg-red-50 border-2 border-red-300 rounded-xl font-bold text-red-900 hover:bg-red-100 active:scale-95 transition-all">
                Hard<div className="text-xs font-normal opacity-70">par 5</div>
              </button>
            </div>

            <ModeButton icon={SparklesIcon} label="Antonym Mode" sub="Start and target are opposites" accent="purple" onClick={() => onSelect({ type: 'themed', theme: 'antonym' })} />
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-10 flex justify-center">
            <button onClick={() => setShowStats(true)} className="text-gray-400 hover:text-gray-900 font-medium underline decoration-2 underline-offset-4 transition-colors flex items-center gap-1">
              <BarChart3 className="w-4 h-4" />
              View stats
            </button>
          </motion.div>
        </div>
      </div>

      <StatsModal isOpen={showStats} onClose={() => setShowStats(false)} />
    </>
  );
}
