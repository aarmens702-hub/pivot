# Pivot

A word-ladder game inspired by Lewis Carroll's 1877 puzzle and modern
takes like Wordle and Weaver. Transform a start word into a target word in
five moves or fewer — change one letter, or swap to a synonym, until you
reach the goal.

> **Live demo:** _coming soon (after Phase 5 deploy)_

![CI](https://img.shields.io/badge/CI-passing-success) ![React](https://img.shields.io/badge/React-19-61dafb) ![Node](https://img.shields.io/badge/Node-20-339933) ![License](https://img.shields.io/badge/license-MIT-blue)

## Features

- **Multiple modes** — daily puzzle (deterministic across all clients per UTC day), random, easy / medium / hard difficulty (par 3 / 4 / 5), antonym themed
- **Hint** that reveals the next optimal move (small score penalty)
- **Give up** that reveals the full BFS-shortest solution
- **Wordle-style emoji share** of your chain after winning
- **Streak + stats** tracked locally per browser (current streak, best streak, win %, last 7 daily puzzles)
- **Mobile on-screen keyboard** for phone play
- **Letter-tile feedback** highlighting positions where your current word already matches the target

## Stack

- **Frontend:** React 19, Vite 7, Tailwind v4, Framer Motion, lucide-react
- **Backend:** Express 4, Node 20, Datamuse API (synonyms / antonyms)
- **Testing:** Vitest + React Testing Library
- **Deploy:** Vercel (frontend) + Railway (backend)

## Architecture

```
   ┌──────────────────────────┐         ┌──────────────────────────────┐
   │  React + Vite (browser)  │ ◀─────▶ │  Express (Node 20, Railway)  │
   └──────────────────────────┘         └──────────────────────────────┘
                                                 │
                                                 ├──▶ Weaver dictionary (4,030 words)
                                                 ├──▶ SCOWL common-word tiers
                                                 └──▶ Datamuse API (synonyms, antonyms)
```

The backend builds an in-memory **adjacency graph** of the dictionary at
startup, exposes a small REST API for puzzle generation, validation, and
shortest-path solving, and pre-computes pools of puzzles by difficulty so
`/api/puzzle` is O(1).

## Design decisions

The work that's actually interesting:

### Wildcard-bucket graph construction — O(N·L), not O(N²)

A naive word-ladder graph compares every pair of words: O(N²) where N is
the dictionary size. For 4,030 4-letter words that's ~16M comparisons,
each one a string diff. Instead, we group words by every possible
single-character wildcard (e.g. `bake → *ake, b*ke, ba*e, bak*`). Words
sharing a bucket are exactly the words that differ by one letter. Build is
**O(N · L)** where L is word length, and the resulting 4,030-word graph
constructs in **22ms**. See [`buildGraph`](server/wordGraph.js).

### Split playable / endpoint vocabularies

If the same dictionary supplies both endpoints (start / target) and
intermediate ladder steps, you face a tradeoff: a tight common list
(everyone knows the words) doesn't have enough density for varied
multi-step paths, while a loose Scrabble-style list produces obscure
starts like `AAHS → ABBA`. Pivot splits the two. The *playable*
vocabulary (4,030 Weaver words) is dense enough for short ladders to
exist between any pair, while the *endpoint* vocabulary (intersection
with SCOWL tiers 10–20, ~923 words) ensures every puzzle's start and
target are recognizable. See
[`loadPlayableVocab` / `loadEndpointVocab`](server/wordGraph.js).

### BFS for both solving and generating

A word ladder is a shortest-path problem on an unweighted graph; BFS
gives the optimal solution in linear time. Pivot reuses the same BFS for
two purposes:
- **Solving** — when the player asks for a hint or gives up, BFS returns
  the shortest path from the current word to the target.
- **Generating** — to create a new puzzle, pick a random endpoint, run
  BFS, collect every other endpoint at distance 3–5, sample one as the
  target. This guarantees solvability in the player's move budget.

See [`bfsDistances` / `shortestPath`](server/wordGraph.js).

### Deterministic daily puzzles

Daily puzzles need to give every player the *same* puzzle for the *same*
UTC day, regardless of which server instance handles the request. Pivot
hashes the date string (`YYYY-MM-DD`) with FNV-1a to seed both the start
selection and the target selection — same date → same puzzle, no
database, no shared state. Generated on demand, no precomputed table.
See [`generateDailyPuzzle`](server/puzzleGen.js).

### Async themed-pool boot

Antonym pairs require Datamuse API calls. Doing these synchronously at
startup would delay boot by several seconds; doing them per-request would
hit rate limits. Pivot fires off the antonym fetch as a background task
after server start — `/api/puzzle?theme=antonym` returns 503 until the
pool is ready, then succeeds. See
[`buildAntonymPool`](server/themedGen.js).

### Client-side stats

Streaks and win rate are stored per-browser via localStorage. No
accounts, no schema migrations, no auth. Trade-off: stats don't sync
across devices. For v1 this is the right call; a Postgres-backed
leaderboard is the natural next step. See
[`src/services/stats.js`](src/services/stats.js).

## Quickstart

```bash
git clone https://github.com/<you>/pivot.git
cd pivot
npm install
cd server && npm install && cd ..
npm run dev:all   # boots Vite (5173) + Express (5174)
```

Open http://localhost:5173.

## API reference

| Method | Path                       | Description                                            |
| ------ | -------------------------- | ------------------------------------------------------ |
| GET    | `/api/health`              | Service status, vocab + pool sizes                     |
| GET    | `/api/puzzle`              | Random puzzle. `?difficulty=easy\|medium\|hard` or `?theme=antonym` |
| GET    | `/api/puzzle/daily`        | Today's deterministic puzzle. Optional `?date=YYYY-MM-DD` |
| GET    | `/api/validate`            | Check if a move is legal. `?from=…&word=…`             |
| GET    | `/api/neighbors/:word`     | All one-letter neighbors of `:word`                    |
| GET    | `/api/solution`            | Shortest BFS path. `?start=…&target=…`                 |

## Development

```bash
npm run dev:all          # web + api together
npm run dev              # web only
npm run dev:server       # api only
npm test                 # frontend tests
cd server && npm test    # backend tests
npm run build            # production build
npm run lint
```

## Project layout

```
src/
  components/
    game/              extracted game UI: WordCard, ChainDisplay, GameOver, ...
    Keyboard.jsx       on-screen mobile keyboard
    ShareCard.jsx      Wordle-style emoji share
    StatsModal.jsx     streak + stats display
  services/
    api.js             REST client for the backend
    stats.js           localStorage stats schema
  HomePage.jsx         landing screen
  MenuPage.jsx         mode picker
  PivotGame.jsx        gameplay orchestrator
  constants.js         MAX_MOVES, HINT_COST, etc.
server/
  data/weaver_words.txt    4,030-word dictionary
  wordGraph.js             graph build + BFS + shortest path
  puzzleGen.js             puzzle pool + deterministic daily generator
  themedGen.js             async antonym pool builder
  index.js                 Express app + routes
```

## Roadmap

- Postgres-backed global leaderboards with anonymous user IDs
- More themes (rhymes, hypernyms, related-by-meaning)
- Multiple word lengths (3, 5, 6 letters)
- Sentry for error tracking, Plausible for analytics
- TypeScript migration

## Credits

- Word list adapted from [Weaver](https://wordwormdormdork.com/) and the
  SCOWL English wordlist tiers
- Dictionary definitions from [dictionaryapi.dev](https://dictionaryapi.dev/)
- Synonyms and antonyms from [Datamuse](https://www.datamuse.com/api/)

## License

MIT
