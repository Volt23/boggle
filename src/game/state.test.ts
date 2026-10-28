import { describe, expect, it } from 'vitest';
import { boardForCode } from '../utils/boardCode';
import { gameReducer, initialState, remainingAt, type GameState } from './state';

const loaded = (code = 'ABCDE'): GameState =>
  gameReducer(initialState, { type: 'load', code, letters: boardForCode(code) });

describe('gameReducer', () => {
  it('deals a board covered until the round starts', () => {
    const state = loaded();
    expect(state).toMatchObject({ status: 'ready', code: 'ABCDE', letters: boardForCode('ABCDE') });
  });

  it('runs against a deadline and pauses with the time left', () => {
    let state = gameReducer(loaded(), { type: 'start', durationMs: 180_000, now: 1000 });
    expect(state.status).toBe('running');
    expect(remainingAt(state, 61_000)).toBe(120_000);

    state = gameReducer(state, { type: 'pause', now: 61_000 });
    expect(state.status).toBe('paused');
    expect(remainingAt(state, 999_999)).toBe(120_000);

    state = gameReducer(state, { type: 'resume', now: 500_000 });
    expect(remainingAt(state, 530_000)).toBe(90_000);
  });

  it('finishes running rounds only', () => {
    const running = gameReducer(loaded(), { type: 'start', durationMs: 60_000, now: 0 });
    expect(gameReducer(running, { type: 'finish' })).toMatchObject({ status: 'finished', remainingMs: 0 });
    const paused = gameReducer(running, { type: 'pause', now: 10 });
    expect(gameReducer(paused, { type: 'finish' })).toBe(paused);
  });

  it('ignores actions that do not fit the current status', () => {
    expect(gameReducer(initialState, { type: 'start', durationMs: 1, now: 0 })).toBe(initialState);
    const ready = loaded();
    expect(gameReducer(ready, { type: 'pause', now: 0 })).toBe(ready);
    expect(gameReducer(ready, { type: 'resume', now: 0 })).toBe(ready);
  });

  it('skips reloading the current board when asked', () => {
    const running = gameReducer(loaded('ABCDE'), { type: 'start', durationMs: 60_000, now: 0 });
    const same = { type: 'load', code: 'ABCDE', letters: boardForCode('ABCDE'), onlyIfNew: true } as const;
    expect(gameReducer(running, same)).toBe(running);
    expect(gameReducer(running, { ...same, onlyIfNew: false }).status).toBe('ready');
    expect(gameReducer(running, { ...same, code: 'XYZ23' }).code).toBe('XYZ23');
  });
});
