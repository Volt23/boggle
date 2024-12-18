import { create } from 'zustand';
import { supabase, type GameSession, type GameUpdate } from '../lib/supabase';
import { generateGrid } from '../utils/boggleLogic';

interface GameState {
  sessionId: string | null;
  isHost: boolean;
  letters: string[];
  seconds: number;
  isRunning: boolean;
  error: string | null;
  initialized: boolean;
  createSession: () => Promise<string>;
  joinSession: (id: string) => Promise<void>;
  updateSession: (update: GameUpdate) => Promise<void>;
  setError: (error: string | null) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  sessionId: null,
  isHost: false,
  letters: Array(16).fill(''),
  seconds: 180,
  isRunning: false,
  error: null,
  initialized: false,

  createSession: async () => {
    try {
      const letters = generateGrid();
      const { data, error } = await supabase
        .from('game_sessions')
        .insert([
          {
            letters,
            timer_seconds: 180,
            is_running: false,
            host_id: crypto.randomUUID(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      const subscription = supabase
        .channel(`game_${data.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'game_sessions',
            filter: `id=eq.${data.id}`,
          },
          (payload) => {
            const update = payload.new as GameSession;
            set({
              letters: update.letters,
              seconds: update.timer_seconds,
              isRunning: update.is_running,
            });
          }
        )
        .subscribe();

      set({
        sessionId: data.id,
        isHost: true,
        letters: data.letters,
        seconds: data.timer_seconds,
        isRunning: data.is_running,
        initialized: true,
      });

      return data.id;
    } catch (error) {
      set({ error: 'Failed to create session' });
      throw error;
    }
  },

  joinSession: async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      const subscription = supabase
        .channel(`game_${id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'game_sessions',
            filter: `id=eq.${id}`,
          },
          (payload) => {
            const update = payload.new as GameSession;
            set({
              letters: update.letters,
              seconds: update.timer_seconds,
              isRunning: update.is_running,
            });
          }
        )
        .subscribe();

      set({
        sessionId: id,
        isHost: false,
        letters: data.letters,
        seconds: data.timer_seconds,
        isRunning: data.is_running,
        initialized: true,
      });
    } catch (error) {
      set({ error: 'Failed to join session' });
      throw error;
    }
  },

  updateSession: async (update: GameUpdate) => {
    const { sessionId } = get();
    if (!sessionId) return;

    try {
      const { error } = await supabase
        .from('game_sessions')
        .update(update)
        .eq('id', sessionId);

      if (error) throw error;

      // Update local state immediately for better UX
      set((state) => ({
        ...state,
        ...update
      }));
    } catch (error) {
      set({ error: 'Failed to update session' });
      throw error;
    }
  },

  setError: (error) => set({ error }),
}));