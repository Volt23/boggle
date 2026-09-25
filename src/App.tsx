import { useCallback, useEffect, useRef, useState } from 'react';
import { Dices } from 'lucide-react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { generateGrid, isValidGrid } from './utils/boggleLogic';
import { Timer } from './components/Timer';
import { BoggleGrid } from './components/BoggleGrid';
import { RevealButton } from './components/RevealButton';
import { SolutionsList } from './components/SolutionsList';
import { supabase } from './lib/supabase';
import { playTimerEndSound } from './utils/sound';
import { findWordsInBoggle } from './utils/BoggleSolver';
import { loadDictionary } from './utils/dictionary';

const ROUND_SECONDS = 180;
const BOARD_ID = 1;

function convertTo2DGrid(letters: string[]): string[][] {
  const grid: string[][] = [];
  for (let i = 0; i < 4; i++) {
    grid.push(letters.slice(i * 4, (i + 1) * 4));
  }
  return grid;
}

function App() {
  const [letters, setLetters] = useState<string[]>(Array(16).fill(''));
  const [seconds, setSeconds] = useState(ROUND_SECONDS);
  const [isRunning, setIsRunning] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [solutions, setSolutions] = useState<string[]>([]);
  const [showSolutions, setShowSolutions] = useState(false);
  const [solutionsError, setSolutionsError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);
  // Wall-clock time the round ends; avoids drift and background-tab throttling.
  const deadlineRef = useRef<number | null>(null);
  // Incremented on every new board so stale solver results are discarded.
  const roundRef = useRef(0);

  const startRound = useCallback((newLetters: string[]) => {
    roundRef.current += 1;
    deadlineRef.current = Date.now() + ROUND_SECONDS * 1000;
    setLetters(newLetters);
    setSeconds(ROUND_SECONDS);
    setIsRunning(true);
    setIsHidden(false);
    setShowSolutions(false);
    setSolutions([]);
    setSolutionsError(null);
  }, []);

  useEffect(() => {
    // Subscribe to board changes
    const channel = supabase
      .channel('boggle_board')
      .on('broadcast', { event: 'board_update' }, ({ payload }) => {
        if (isValidGrid(payload?.letters)) {
          startRound(payload.letters);
        }
      })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setSyncError('Live sync unavailable — other players may not see new boards.');
        } else if (status === 'SUBSCRIBED') {
          setSyncError(null);
        }
      });
    channelRef.current = channel;

    // Get initial board state
    let cancelled = false;
    supabase
      .from('boggle_board')
      .select('letters')
      .eq('id', BOARD_ID)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('Failed to load board:', error);
          setSyncError('Could not load the shared board.');
        } else if (isValidGrid(data?.letters)) {
          setLetters(data.letters);
        }
      });

    return () => {
      cancelled = true;
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [startRound]);

  useEffect(() => {
    if (!isRunning) return;

    const tick = () => {
      const deadline = deadlineRef.current ?? Date.now();
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSeconds(remaining);
      if (remaining === 0) setIsRunning(false);
    };

    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [isRunning]);

  const calculateSolutions = useCallback(async (board: string[]) => {
    const round = roundRef.current;
    try {
      const dictionary = await loadDictionary();
      if (round !== roundRef.current) return;
      setSolutions(findWordsInBoggle(convertTo2DGrid(board), dictionary));
      setShowSolutions(true);
    } catch (error) {
      console.error('Failed to compute solutions:', error);
      if (round === roundRef.current) {
        setSolutionsError('Could not load the dictionary to show solutions.');
      }
    }
  }, []);

  // Runs once when the countdown reaches zero (kept out of the state updater,
  // which React may call more than once).
  const timeUp = seconds === 0;
  useEffect(() => {
    if (!timeUp || !letters.some(Boolean)) return;
    setIsHidden(true);
    playTimerEndSound();
    calculateSolutions(letters);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- trigger only on reaching zero
  }, [timeUp]);

  const handleShuffle = async () => {
    const newLetters = generateGrid();
    startRound(newLetters);

    const channel = channelRef.current;
    const [broadcast, update] = await Promise.allSettled([
      channel
        ? channel.send({ type: 'broadcast', event: 'board_update', payload: { letters: newLetters } })
        : Promise.resolve('error' as const),
      supabase.from('boggle_board').update({ letters: newLetters }).eq('id', BOARD_ID),
    ]);

    const broadcastFailed = broadcast.status === 'rejected' || broadcast.value !== 'ok';
    const updateFailed = update.status === 'rejected' || !!update.value.error;
    if (broadcastFailed || updateFailed) {
      console.error('Failed to share board:', { broadcast, update });
      setSyncError('New board could not be shared with other players.');
    } else {
      setSyncError(null);
    }
  };

  const handlePause = () => {
    if (deadlineRef.current !== null) {
      setSeconds(Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000)));
    }
    deadlineRef.current = null;
    setIsRunning(false);
  };

  const handleResume = () => {
    if (seconds > 0) {
      deadlineRef.current = Date.now() + seconds * 1000;
      setIsRunning(true);
    }
  };

  const handleToggleReveal = () => {
    setIsHidden(hidden => !hidden);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 sm:p-8">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Boggle</h1>
        </div>

        {syncError && (
          <div role="status" className="rounded-lg bg-amber-50 text-amber-800 text-sm px-4 py-2 text-center">
            {syncError}
          </div>
        )}

        <div className="flex flex-col items-center gap-4">
          <Timer
            seconds={seconds}
            isRunning={isRunning}
            onPause={handlePause}
            onPlay={handleResume}
          />
        </div>

        <BoggleGrid letters={letters} isHidden={isHidden} />

        {seconds === 0 && (
          <div className="space-y-4">
            <RevealButton isHidden={isHidden} onToggle={handleToggleReveal} />
            {solutionsError && <div className="text-red-600 text-center">{solutionsError}</div>}
            <SolutionsList solutions={solutions} isVisible={showSolutions} />
          </div>
        )}

        <button
          onClick={handleShuffle}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          <Dices size={20} />
          Shuffle & Start New Round
        </button>

        <div className="text-center text-sm text-gray-500">
          Write your words on paper and compare them when the timer ends!
        </div>
      </div>
    </div>
  );
}

export default App;
