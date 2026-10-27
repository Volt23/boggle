import { TILE_COUNT, isValidGrid } from '../utils/boggleLogic';

export type Status = 'idle' | 'running' | 'paused' | 'finished';

/** The part of the game state shared between players. */
export interface Snapshot {
  /** Identifies a round; pause/resume updates keep it. */
  roundId: string;
  /** Increases with every new round, so concurrent shuffles converge on one board. */
  seq: number;
  letters: string[];
  status: Status;
  durationMs: number;
  /** Time left at the moment the snapshot was taken. */
  remainingMs: number;
}

export interface GameState extends Snapshot {
  /** When the round ends, on the local `performance.now()` clock (running only). */
  endsAt: number;
}

export const DURATIONS_MIN = [1, 2, 3, 4, 5];
export const DEFAULT_DURATION_MS = 3 * 60_000;

export const initialState: GameState = {
  roundId: '',
  seq: 0,
  letters: Array(TILE_COUNT).fill(''),
  status: 'idle',
  durationMs: DEFAULT_DURATION_MS,
  remainingMs: DEFAULT_DURATION_MS,
  endsAt: 0,
};

export type Action =
  | { type: 'apply'; snapshot: Snapshot; now: number; remote?: boolean }
  | { type: 'finish' }
  /** A board saved by an earlier session; only used if nothing else is loaded. */
  | { type: 'restore'; letters: string[] };

export function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'apply': {
      const { snapshot, now, remote } = action;
      if (remote && !isNewer(snapshot, state)) return state;
      const remainingMs = Math.max(0, snapshot.remainingMs);
      const finished = snapshot.status === 'finished' || remainingMs === 0;
      return {
        ...snapshot,
        status: finished ? 'finished' : snapshot.status,
        remainingMs: finished ? 0 : remainingMs,
        endsAt: snapshot.status === 'running' ? now + remainingMs : 0,
      };
    }
    case 'finish':
      return state.status === 'running' ? { ...state, status: 'finished', remainingMs: 0, endsAt: 0 } : state;
    case 'restore':
      return state.status === 'idle'
        ? { ...state, roundId: 'restored', letters: action.letters, status: 'paused', remainingMs: state.durationMs }
        : state;
  }
}

/** Updates to the current round always apply; another round only if it is later. */
function isNewer(incoming: Snapshot, current: Snapshot): boolean {
  if (incoming.roundId === current.roundId) return true;
  if (incoming.seq !== current.seq) return incoming.seq > current.seq;
  return incoming.roundId > current.roundId;
}

/** The time left right now, in ms. */
export function remainingAt(state: GameState, now: number): number {
  return state.status === 'running' ? Math.max(0, state.endsAt - now) : state.remainingMs;
}

export function toSnapshot(state: GameState, now: number): Snapshot {
  const { roundId, seq, letters, status, durationMs } = state;
  return { roundId, seq, letters, status, durationMs, remainingMs: remainingAt(state, now) };
}

/** Validates a snapshot received from another player. */
export function parseSnapshot(payload: unknown): Snapshot | null {
  if (!payload || typeof payload !== 'object') return null;
  const p = payload as Record<string, unknown>;
  const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
  if (
    typeof p.roundId !== 'string' ||
    !p.roundId ||
    !isNumber(p.seq) ||
    !isValidGrid(p.letters) ||
    !['running', 'paused', 'finished'].includes(p.status as string) ||
    !isNumber(p.durationMs) ||
    !isNumber(p.remainingMs)
  ) {
    return null;
  }
  const durationMs = Math.min(Math.max(p.durationMs, 10_000), 60 * 60_000);
  return {
    roundId: p.roundId,
    seq: p.seq,
    letters: p.letters,
    status: p.status as Status,
    durationMs,
    remainingMs: Math.min(Math.max(p.remainingMs, 0), durationMs),
  };
}
