// Generate a Wordle-style emoji grid for the chain. One row per word, one tile
// per letter — green if it matches the target letter at that position.
export function buildShareString({ chain, target, moves, parDistance, mode }) {
  const tag = mode === 'daily' ? 'Pivot Daily' : 'Pivot';
  const header = `${tag} ${chain[0].toUpperCase()}→${target.toUpperCase()} ${moves}/${parDistance ?? '?'}`;
  const grid = chain.map(word =>
    word.split('').map((ch, i) => (ch === target[i] ? '🟩' : '⬜')).join('')
  );
  return [header, ...grid].join('\n');
}
