import React from 'react';
import { motion } from 'framer-motion';

// Row of beads showing moves used vs total. Filled beads pulse on appear.
export default function ProgressBeads({ total, used }) {
  return (
    <div className="flex items-center justify-center gap-3">
      {Array.from({ length: total }).map((_, i) => {
        const isUsed = i < used;
        return (
          <motion.div key={i} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.05 }}>
            <motion.div
              animate={isUsed ? { scale: [1, 1.15, 1] } : {}}
              transition={{ duration: 0.3 }}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${isUsed ? 'bg-gray-900 shadow-lg' : 'bg-gray-200'}`}
            />
          </motion.div>
        );
      })}
    </div>
  );
}
