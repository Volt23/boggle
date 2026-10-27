import { describe, expect, it } from 'vitest';
import { generateGrid } from '../utils/boggleLogic';
import { gameReducer, initialState, parseSnapshot, remainingAt, toSnapshot, type Snapshot } from './state';

const round = (patch: Partial<Snapshot> = {}): Snapshot => ({
  roundId: 'a',
  seq: 1,
  letters: generateGrid(),
  status: 'running',
  durationMs: 180_000,
  remainingMs: 180_000,
  ...patch,
});

describe('gameReducer', () => {
  it('starts a round with a local deadline and pauses with the time left', () => {
    let state = gameReducer(initialState, { type: 'apply', snapshot: round(), now: 1000 });
    expect(state.endsAt).toBe(181_000);
    expect(remainingAt(state, 61_000)).toBe(120_000);

    state = gameReducer(state, { type: 'apply', snapshot: { ...toSnapshot(state, 61_000), status: 'paused' }, now: 61_000 });
    expect(state.status).toBe('paused');
    expect(remainingAt(state, 999_999)).toBe(120_000);
  });

  it('finishes rounds that run out, but not paused ones', () => {
    const running = gameReducer(initialState, { type: 'apply', snapshot: round(), now: 0 });
    expect(gameReducer(running, { type: 'finish' }).status).toBe('finished');
    const paused = gameReducer(initialState, { type: 'apply', snapshot: round({ status: 'paused' }), now: 0 });
    expect(gameReducer(paused, { type: 'finish' })).toBe(paused);
    expect(gameReducer(initialState, { type: 'apply', snapshot: round({ remainingMs: 0 }), now: 0 }).status).toBe('finished');
  });

  it('converges when two players shuffle at the same time', () => {
    const a = round({ roundId: 'a', seq: 2 });
    const b = round({ roundId: 'b', seq: 2 });
    const playerA = gameReducer(gameReducer(initialState, { type: 'apply', snapshot: a, now: 0 }), {
      type: 'apply', snapshot: b, now: 0, remote: true,
    });
    const playerB = gameReducer(gameReducer(initialState, { type: 'apply', snapshot: b, now: 0 }), {
      type: 'apply', snapshot: a, now: 0, remote: true,
    });
    expect(playerA.roundId).toBe('b');
    expect(playerB.roundId).toBe('b');
  });

  it('ignores stale rounds but accepts updates to the current one', () => {
    const state = gameReducer(initialState, { type: 'apply', snapshot: round({ roundId: 'new', seq: 5 }), now: 0 });
    expect(gameReducer(state, { type: 'apply', snapshot: round({ roundId: 'old', seq: 4 }), now: 0, remote: true })).toBe(state);
    const paused = gameReducer(state, {
      type: 'apply', snapshot: round({ roundId: 'new', seq: 5, status: 'paused' }), now: 0, remote: true,
    });
    expect(paused.status).toBe('paused');
  });

  it('restores a saved board only when nothing is loaded', () => {
    const letters = generateGrid();
    const restored = gameReducer(initialState, { type: 'restore', letters });
    expect(restored).toMatchObject({ status: 'paused', letters, remainingMs: initialState.durationMs });
    const running = gameReducer(initialState, { type: 'apply', snapshot: round(), now: 0 });
    expect(gameReducer(running, { type: 'restore', letters })).toBe(running);
  });
});

describe('parseSnapshot', () => {
  it('accepts valid payloads and clamps times', () => {
    const valid = round();
    expect(parseSnapshot(valid)).toEqual(valid);
    expect(parseSnapshot(round({ remainingMs: 1e9 }))?.remainingMs).toBe(180_000);
  });

  it('rejects malformed payloads', () => {
    for (const bad of [null, 'x', {}, round({ letters: ['A'] }), round({ status: 'idle' }), round({ seq: NaN }), round({ roundId: '' })]) {
      expect(parseSnapshot(bad)).toBeNull();
    }
  });
});
