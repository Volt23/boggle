import { TILE_COUNT } from '../utils/boggleLogic';

/** idle: no board yet · ready: board dealt but covered until the round starts */
export type Status = 'idle' | 'ready' | 'running' | 'paused' | 'finished';

export interface GameState {
  /** Board code; the board is derived from it. */
  code: string;
  letters: string[];
  status: Status;
  durationMs: number;
  /** Time left while paused or finished. */
  remainingMs: number;
  /** When the round ends, on the `performance.now()` clock (running only). */
  endsAt: number;
}

export const DURATIONS_MIN = [1, 2, 3, 4, 5];

export const initialState: GameState = {
  code: '',
  letters: Array(TILE_COUNT).fill(''),
  status: 'idle',
  durationMs: 0,
  remainingMs: 0,
  endsAt: 0,
};

export type Action =
  | { type: 'load'; code: string; letters: string[]; onlyIfNew?: boolean }
  | { type: 'start'; durationMs: number; now: number }
  | { type: 'pause'; now: number }
  | { type: 'resume'; now: number }
  | { type: 'finish' };

export function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'load':
      if (action.onlyIfNew && action.code === state.code) return state;
      return { ...initialState, code: action.code, letters: action.letters, status: 'ready' };
    case 'start':
      return state.status === 'ready'
        ? { ...state, status: 'running', durationMs: action.durationMs, endsAt: action.now + action.durationMs }
        : state;
    case 'pause':
      return state.status === 'running'
        ? { ...state, status: 'paused', remainingMs: remainingAt(state, action.now) }
        : state;
    case 'resume':
      return state.status === 'paused' ? { ...state, status: 'running', endsAt: action.now + state.remainingMs } : state;
    case 'finish':
      return state.status === 'running' ? { ...state, status: 'finished', remainingMs: 0 } : state;
  }
}

/** The time left at `now`, in ms. */
export function remainingAt(state: GameState, now: number): number {
  return state.status === 'running' ? Math.max(0, state.endsAt - now) : state.remainingMs;
}
