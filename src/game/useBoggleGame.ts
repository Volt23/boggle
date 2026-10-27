import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { generateGrid, isValidGrid } from '../utils/boggleLogic';
import { playTimerEndSound, unlockAudio } from '../utils/sound';
import { gameReducer, initialState, parseSnapshot, remainingAt, toSnapshot, type Snapshot } from './state';

const CHANNEL = 'boggle_board';
const TICK_MS = 200;

export type Connection = 'connecting' | 'live' | 'offline';

const randomId = () => crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
const clientId = randomId();

export function useBoggleGame(durationMs: number) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [connection, setConnection] = useState<Connection>(supabase ? 'connecting' : 'offline');
  const [players, setPlayers] = useState(1);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Countdown: derived from a deadline, so it never drifts and survives background tabs
  const [tickMs, setTickMs] = useState(state.remainingMs);
  useEffect(() => {
    if (state.status !== 'running') return;
    let done = false;
    const tick = () => {
      if (done) return;
      const left = remainingAt(state, performance.now());
      // Only re-render when the displayed second changes
      setTickMs((prev) => (Math.ceil(prev / 1000) === Math.ceil(left / 1000) ? prev : left));
      if (left <= 0) {
        done = true;
        playTimerEndSound();
        dispatch({ type: 'finish' });
      }
    };
    tick();
    const interval = window.setInterval(tick, TICK_MS);
    return () => {
      done = true;
      window.clearInterval(interval);
    };
  }, [state]);
  const remainingMs = state.status === 'running' ? tickMs : state.remainingMs;

  // Realtime sync with the other players
  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    let active = true;

    const channel = client.channel(CHANNEL, {
      config: { broadcast: { self: false }, presence: { key: clientId } },
    });
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'state' }, ({ payload }) => {
        const snapshot = parseSnapshot(payload);
        if (snapshot) dispatch({ type: 'apply', snapshot, now: performance.now(), remote: true });
      })
      .on('broadcast', { event: 'request_state' }, () => {
        const current = stateRef.current;
        if (current.status !== 'idle') {
          channel.send({ type: 'broadcast', event: 'state', payload: toSnapshot(current, performance.now()) });
        }
      })
      .on('presence', { event: 'sync' }, () => {
        setPlayers(Math.max(1, Object.keys(channel.presenceState()).length));
      })
      .subscribe((status) => {
        if (!active) return;
        if (status === 'SUBSCRIBED') {
          setConnection('live');
          channel.track({ online_at: Date.now() });
          channel.send({ type: 'broadcast', event: 'request_state', payload: {} });
        } else {
          setConnection('offline'); // the client keeps retrying in the background
        }
      });

    // The last board, for when nobody else is online to share theirs
    client
      .from('boggle_board')
      .select('letters')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.warn('Could not load the saved board:', error.message);
        else if (active && isValidGrid(data?.letters)) dispatch({ type: 'restore', letters: data.letters });
      });

    return () => {
      active = false;
      channelRef.current = null;
      client.removeChannel(channel);
    };
  }, []);

  const publish = useCallback((snapshot: Snapshot) => {
    dispatch({ type: 'apply', snapshot, now: performance.now() });
    channelRef.current?.send({ type: 'broadcast', event: 'state', payload: snapshot });
  }, []);

  const newRound = useCallback(() => {
    unlockAudio();
    const letters = generateGrid();
    publish({
      roundId: randomId(),
      seq: stateRef.current.seq + 1,
      letters,
      status: 'running',
      durationMs,
      remainingMs: durationMs,
    });
    supabase
      ?.from('boggle_board')
      .update({ letters })
      .eq('id', 1)
      .then(({ error }) => error && console.warn('Could not save the board:', error.message));
  }, [durationMs, publish]);

  const pause = useCallback(() => {
    const current = stateRef.current;
    if (current.status !== 'running') return;
    publish({ ...toSnapshot(current, performance.now()), status: 'paused' });
  }, [publish]);

  const resume = useCallback(() => {
    unlockAudio();
    const current = stateRef.current;
    if (current.status !== 'paused') return;
    publish({ ...toSnapshot(current, performance.now()), status: 'running' });
  }, [publish]);

  return { state, remainingMs, connection, players, newRound, pause, resume };
}
