import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Send, Undo2, Loader2, Lightbulb, Flag } from 'lucide-react';
import { fetchPuzzle, fetchDailyPuzzle, validateMove, fetchDefinition, fetchSolution } from './services/api';
import { recordGame } from './services/stats';
import Keyboard from './components/Keyboard';
import WordCard from './components/game/WordCard';
import ProgressBeads from './components/game/ProgressBeads';
import ChainDisplay from './components/game/ChainDisplay';
import GameOver from './components/game/GameOver';
import { MAX_MOVES, HINT_COST, CLEAR_BONUS, WORD_LEN, unusedMovesBonus } from './constants';

export default function PivotGame({ onExit, mode = { type: 'random' } }) {
  const [puzzle, setPuzzle] = useState(null);
  const [chain, setChain] = useState([]);
  const [definitions, setDefinitions] = useState(new Map());
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [movesLeft, setMovesLeft] = useState(MAX_MOVES);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [score, setScore] = useState(0);
  const [moveTypes, setMoveTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [solution, setSolution] = useState(null);
  const [gaveUp, setGaveUp] = useState(false);
  const [recorded, setRecorded] = useState(false);

  const loadDefinition = async (word) => {
    const def = await fetchDefinition(word);
    if (def) setDefinitions(prev => new Map(prev).set(word, def));
  };

  const loadPuzzle = async () => {
    setLoading(true);
    try {
      let p;
      if (mode.type === 'daily') p = await fetchDailyPuzzle();
      else if (mode.type === 'difficulty') p = await fetchPuzzle({ difficulty: mode.difficulty });
      else if (mode.type === 'themed') p = await fetchPuzzle({ theme: mode.theme });
      else p = await fetchPuzzle();

      setPuzzle(p);
      setChain([p.start]);
      setDefinitions(new Map());
      setInput('');
      setError('');
      setMovesLeft(MAX_MOVES);
      setGameOver(false);
      setWon(false);
      setScore(0);
      setMoveTypes([]);
      setHint(null);
      setSolution(null);
      setGaveUp(false);
      setRecorded(false);
      loadDefinition(p.start);
      loadDefinition(p.target);
    } catch (err) {
      console.error('Failed to generate puzzle:', err);
      setError(err.message || 'Failed to generate puzzle. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadPuzzle(); }, [mode.type, mode.difficulty, mode.theme]);

  // Record stats once per finished game (won or lost).
  useEffect(() => {
    if (!gameOver || recorded || !puzzle) return;
    recordGame({
      mode: mode.type === 'daily' ? 'daily' : mode.type,
      won,
      moves: chain.length - 1,
      dateKey: puzzle.dateKey,
    });
    setRecorded(true);
  }, [gameOver, recorded, won, chain.length, puzzle, mode.type]);

  const handleSubmit = async () => {
    if (loading || !input.trim() || gameOver) return;
    setLoading(true);
    setError('');
    setHint(null);

    const word = input.toLowerCase().trim();
    const currentWord = chain[chain.length - 1];

    try {
      const { inDict, isNeighbor, isSynonym } = await validateMove(currentWord, word);
      if (!inDict) { setError('Not a real word.'); setLoading(false); return; }
      if (!isNeighbor && !isSynonym) {
        setError('Not a valid move — must differ by one letter or be a synonym.');
        setLoading(false);
        return;
      }

      const moveType = isNeighbor ? 'letter' : 'synonym';
      loadDefinition(word);
      const newChain = [...chain, word];
      const newMoveTypes = [...moveTypes, moveType];
      setChain(newChain);
      setMoveTypes(newMoveTypes);
      setInput('');

      const newMovesLeft = movesLeft - 1;
      setMovesLeft(newMovesLeft);

      const moveScore = moveType === 'letter' ? 1 : 2;
      const newScore = score + moveScore;
      setScore(newScore);

      if (word === puzzle.target) {
        setWon(true);
        setGameOver(true);
        setScore(newScore + unusedMovesBonus(newMovesLeft) + CLEAR_BONUS);
      } else if (newMovesLeft === 0) {
        setGameOver(true);
        setWon(false);
      }
    } catch (err) {
      console.error(err);
      setError('Network error, please try again');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleUndo = () => {
    if (chain.length > 1 && !gameOver) {
      setChain(chain.slice(0, -1));
      setMoveTypes(moveTypes.slice(0, -1));
      setMovesLeft(movesLeft + 1);
      setScore(Math.max(0, score - 1));
      setHint(null);
    }
  };

  const handleHint = async () => {
    if (gameOver || hintLoading || !puzzle) return;
    setHintLoading(true);
    setError('');
    try {
      const current = chain[chain.length - 1];
      const { path } = await fetchSolution(current, puzzle.target);
      if (!path || path.length < 2) {
        setError('No hint available.');
      } else {
        setHint(path[1]);
        setScore(Math.max(0, score - HINT_COST));
      }
    } catch (err) {
      setError('Failed to fetch hint.');
    } finally {
      setHintLoading(false);
    }
  };

  const handleGiveUp = async () => {
    if (gameOver || !puzzle) return;
    try {
      const { path } = await fetchSolution(chain[chain.length - 1], puzzle.target);
      const fullPath = path ? [...chain.slice(0, -1), ...path] : chain;
      setSolution(fullPath);
      setGaveUp(true);
      setGameOver(true);
      setWon(false);
    } catch (err) {
      setError('Failed to fetch solution.');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !loading) { e.preventDefault(); handleSubmit(); }
    else if (e.key === 'Escape') { setInput(''); setError(''); }
  };

  if (!puzzle) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        {error ? (
          <div className="max-w-md text-center space-y-4">
            <div className="text-3xl font-black text-red-600">⚠️ Can't reach backend</div>
            <div className="text-gray-700">{error}</div>
            <div className="text-sm text-gray-500 font-mono bg-gray-100 p-4 rounded-xl text-left">cd server && npm start</div>
            <button onClick={loadPuzzle} className="px-6 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-700">Retry</button>
          </div>
        ) : (
          <div className="text-gray-900 text-2xl font-semibold flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin" />
            Loading puzzle...
          </div>
        )}
      </div>
    );
  }

  const startDef = definitions.get(puzzle.start);
  const targetDef = definitions.get(puzzle.target);
  const modeLabel = mode.type === 'daily' ? 'Daily Puzzle'
    : mode.type === 'difficulty' ? `${mode.difficulty.toUpperCase()} Puzzle`
    : mode.type === 'themed' ? 'Antonym Puzzle'
    : 'Random Puzzle';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between mb-2">
          <div className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-bold uppercase tracking-wider text-gray-600">
            {modeLabel}
          </div>
          {onExit && (
            <button
              onClick={onExit}
              aria-label="Back to menu"
              className="px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:border-gray-400 hover:bg-gray-50 active:scale-95 transition-all"
            >
              Home
            </button>
          )}
        </div>

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-gray-900" />
            <h1 className="text-7xl font-black text-gray-900 tracking-tight">PIVOT</h1>
            <Sparkles className="w-8 h-8 text-gray-900" />
          </div>
          <p className="text-xl text-gray-600 font-semibold">Transform words through logic and language</p>
        </motion.div>

        <div className="mb-8">
          <ProgressBeads total={MAX_MOVES} used={MAX_MOVES - movesLeft} />
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <WordCard word={puzzle.start} definition={startDef} label="Start Word" />
          <WordCard word={puzzle.target} definition={targetDef} label="Target Word" isTarget par={puzzle.distance} />
        </div>

        <div className="bg-white rounded-3xl border-2 border-gray-200 p-8 shadow-2xl mb-6">
          {!gameOver ? (
            <>
              <div className="mb-8">
                <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 text-center">📝 Your Chain</div>
                <ChainDisplay chain={chain} definitions={definitions} moveTypes={moveTypes} target={puzzle.target} />
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value.toLowerCase())}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your next word..."
                    disabled={loading}
                    maxLength={WORD_LEN}
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                    aria-label="Next word"
                    className="w-full px-6 py-4 text-lg font-semibold bg-white border-2 border-gray-300 rounded-2xl focus:outline-none focus:border-gray-900 focus:ring-4 focus:ring-gray-100 transition-all placeholder:text-gray-400 disabled:bg-gray-50"
                  />
                  {loading && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                    </div>
                  )}
                </div>

                {hint && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-yellow-50 border-2 border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-800 font-semibold text-center">
                    💡 Try <span className="font-mono font-black text-yellow-900">{hint.toUpperCase()}</span> next (-{HINT_COST} score)
                  </motion.div>
                )}

                {error && (
                  <motion.div role="alert" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 border-2 border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 font-semibold text-center">
                    ❌ {error}
                  </motion.div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleSubmit}
                    disabled={loading || !input.trim()}
                    aria-label="Submit word"
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-900 to-gray-700 text-white font-bold rounded-xl hover:from-gray-800 hover:to-gray-600 active:scale-95 disabled:from-gray-300 disabled:to-gray-300 disabled:text-gray-500 transition-all shadow-lg"
                  >
                    {loading ? (<><Loader2 className="w-5 h-5 animate-spin" />Checking...</>) : (<><Send className="w-5 h-5" />Submit</>)}
                  </button>
                  <button onClick={handleUndo} disabled={chain.length <= 1 || loading} aria-label="Undo last move" className="px-4 py-3 bg-white border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:border-gray-400 hover:bg-gray-50 active:scale-95 disabled:opacity-50 transition-all">
                    <Undo2 className="w-5 h-5" />
                  </button>
                  <button onClick={handleHint} disabled={hintLoading || loading} aria-label={`Hint (costs ${HINT_COST} score)`} className="px-4 py-3 bg-yellow-50 border-2 border-yellow-300 text-yellow-800 font-bold rounded-xl hover:bg-yellow-100 active:scale-95 disabled:opacity-50 transition-all">
                    {hintLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lightbulb className="w-5 h-5" />}
                  </button>
                  <button onClick={handleGiveUp} disabled={loading} aria-label="Give up and reveal solution" className="px-4 py-3 bg-red-50 border-2 border-red-200 text-red-700 font-bold rounded-xl hover:bg-red-100 active:scale-95 disabled:opacity-50 transition-all">
                    <Flag className="w-5 h-5" />
                  </button>
                </div>

                <Keyboard
                  onKey={(k) => setInput((input + k).slice(0, WORD_LEN).toLowerCase())}
                  onBackspace={() => setInput(input.slice(0, -1))}
                  onSubmit={handleSubmit}
                  disabled={loading}
                />

                <div className="hidden md:block text-center text-sm text-gray-500 font-medium">
                  Press <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono font-bold">Enter</kbd> to submit
                  {' · '}
                  <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono font-bold">Esc</kbd> to clear
                </div>

                <div className="text-center text-sm text-gray-700 pt-4 border-t-2 border-gray-200 font-semibold">
                  🎯 Moves left: <span className="text-gray-900">{movesLeft}</span> ·
                  ⭐ Score: <span className="text-gray-900">{score}</span>
                  {puzzle.distance != null && (<> · 📏 Par: <span className="text-gray-900">{puzzle.distance}</span></>)}
                </div>
              </div>
            </>
          ) : (
            <GameOver
              won={won}
              score={score}
              chain={chain}
              moveTypes={moveTypes}
              movesLeft={movesLeft}
              targetWord={puzzle.target}
              parDistance={puzzle.distance}
              mode={mode.type}
              solution={solution}
              gaveUp={gaveUp}
              onPlayAgain={loadPuzzle}
            />
          )}
        </div>

        <div className="text-center text-sm text-gray-500 font-medium">
          <p>Change one letter at a time · Every step must be a real word</p>
        </div>
      </div>
    </div>
  );
}
