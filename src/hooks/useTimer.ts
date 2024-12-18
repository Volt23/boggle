import { useState, useEffect, useCallback } from 'react';
import { playTimerEndSound } from '../utils/sound';

const DEFAULT_DURATION = 180; // 3 minutes in seconds

export function useTimer() {
  const [seconds, setSeconds] = useState(DEFAULT_DURATION);
  const [isRunning, setIsRunning] = useState(false);

  const reset = useCallback(() => {
    setSeconds(DEFAULT_DURATION);
    setIsRunning(false);
  }, []);

  const start = useCallback(() => {
    setSeconds(DEFAULT_DURATION);
    setIsRunning(true);
  }, []);

  const resume = useCallback(() => {
    if (seconds > 0) {
      setIsRunning(true);
    }
  }, [seconds]);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const updateDuration = useCallback((newSeconds: number) => {
    setSeconds(newSeconds);
  }, []);

  useEffect(() => {
    let interval: number | undefined;

    if (isRunning && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            playTimerEndSound();
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

  return {
    seconds,
    isRunning,
    start,
    pause,
    resume,
    reset,
    updateDuration
  };
}