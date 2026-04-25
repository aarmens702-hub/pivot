// Frontend game constants. Backend has its own copies in server/wordGraph.js
// (WORD_LEN) and server/puzzleGen.js (MIN_DIST/MAX_DIST/POOL_SIZE) since they
// run in a separate Node process.
export const MAX_MOVES = 5;
export const HINT_COST = 1;
export const CLEAR_BONUS = 5;
export const WORD_LEN = 4;

export const unusedMovesBonus = (movesLeft) => movesLeft * 2;
