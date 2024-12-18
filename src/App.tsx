import React, { useEffect, useState } from 'react';
import { Dices } from 'lucide-react';
import { generateGrid } from './utils/boggleLogic';
import { Timer } from './components/Timer';
import { BoggleGrid } from './components/BoggleGrid';
import { RevealButton } from './components/RevealButton';
import { SolutionsList } from './components/SolutionsList';
import { supabase } from './lib/supabase';
import { playTimerEndSound } from './utils/sound';
import { findWordsInBoggle } from './utils/BoggleSolver';
import { loadDictionary } from './utils/dictionary';

function App() {
  const [letters, setLetters] = useState<string[]>(Array(16).fill(''));
  const [seconds, setSeconds] = useState(180);
  const [isRunning, setIsRunning] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [solutions, setSolutions] = useState<string[]>([]);
  const [showSolutions, setShowSolutions] = useState(false);

  useEffect(() => {
    // Subscribe to board changes
    const channel = supabase.channel('boggle_board')
      .on('broadcast', { event: 'board_update' }, ({ payload }) => {
        setLetters(payload.letters);
        setSeconds(180);
        setIsRunning(true);
        setIsHidden(false);
        setShowSolutions(false);
        setSolutions([]);
      })
      .subscribe();

    // Get initial board state
    supabase
      .from('boggle_board')
      .select('letters')
      .single()
      .then(({ data }) => {
        if (data?.letters) {
          setLetters(data.letters);
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let interval: number | undefined;

    if (isRunning && seconds > 0) {
      interval = setInterval(() => {
        setSeconds(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsHidden(true);
            playTimerEndSound();
            calculateSolutions();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, seconds]);

  const calculateSolutions = async () => {
    const dictionary = await loadDictionary();
    const grid = convertTo2DGrid(letters);
    const foundWords = findWordsInBoggle(grid, dictionary);
    setSolutions(foundWords);
    setShowSolutions(true);
  };

  const convertTo2DGrid = (letters: string[]): string[][] => {
    const grid: string[][] = [];
    for (let i = 0; i < 4; i++) {
      grid.push(letters.slice(i * 4, (i + 1) * 4));
    }
    return grid;
  };

  const handleShuffle = async () => {
    const newLetters = generateGrid();
    
    setLetters(newLetters);
    setSeconds(180);
    setIsRunning(true);
    setIsHidden(false);
    setShowSolutions(false);
    setSolutions([]);

    await supabase.channel('boggle_board').send({
      type: 'broadcast',
      event: 'board_update',
      payload: { letters: newLetters }
    });

    await supabase
      .from('boggle_board')
      .update({ letters: newLetters })
      .eq('id', 1);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleResume = () => {
    if (seconds > 0) {
      setIsRunning(true);
    }
  };

  const handleToggleReveal = () => {
    setIsHidden(!isHidden);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 sm:p-8">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Boggle</h1>
        </div>

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