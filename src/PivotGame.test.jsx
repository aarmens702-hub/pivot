import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PivotGame from './PivotGame';

// Mock the API client so the component doesn't hit a real backend
vi.mock('./services/api', () => ({
  fetchPuzzle: vi.fn(async () => ({ start: 'cake', target: 'bake', distance: 1 })),
  fetchDailyPuzzle: vi.fn(async () => ({ start: 'cake', target: 'bake', distance: 1, dateKey: '2026-04-25' })),
  validateMove: vi.fn(async (from, word) => {
    if (word === 'bake' && from === 'cake') return { inDict: true, isNeighbor: true, isSynonym: false };
    return { inDict: false, isNeighbor: false, isSynonym: false };
  }),
  fetchSolution: vi.fn(async () => ({ path: ['cake', 'bake'], length: 1 })),
  fetchDefinition: vi.fn(async () => null),
}));

beforeEach(() => {
  localStorage.clear();
});

describe('PivotGame happy path', () => {
  it('loads a puzzle, accepts a valid move, and reaches the win state', async () => {
    const user = userEvent.setup();
    render(<PivotGame mode={{ type: 'random' }} />);

    // Wait for puzzle to load
    await waitFor(() => expect(screen.getAllByText(/CAKE/i).length).toBeGreaterThan(0));
    expect(screen.getAllByText(/BAKE/i).length).toBeGreaterThan(0);

    // Type the winning word and submit
    const input = screen.getByLabelText(/next word/i);
    await user.type(input, 'bake');
    await user.click(screen.getByRole('button', { name: /submit word/i }));

    // Game-over win screen
    await waitFor(() => expect(screen.getByText(/Brilliant!/i)).toBeInTheDocument());
  });

  it('rejects invalid words with an error message', async () => {
    const user = userEvent.setup();
    render(<PivotGame mode={{ type: 'random' }} />);
    await waitFor(() => expect(screen.getAllByText(/CAKE/i).length).toBeGreaterThan(0));

    const input = screen.getByLabelText(/next word/i);
    await user.type(input, 'xxxx');
    await user.click(screen.getByRole('button', { name: /submit word/i }));

    await waitFor(() => expect(screen.getByText(/not a real word/i)).toBeInTheDocument());
  });
});
