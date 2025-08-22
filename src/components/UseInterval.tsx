import { useEffect, useRef } from 'react';

type Callback = () => void;

/**
 * A custom React hook that sets up an interval with a declarative API.
 * 
 * @param callback The function to be executed at each interval.
 * @param delay The delay in milliseconds between executions. If null, the interval is paused.
 */
export function useInterval(callback: Callback, delay: number | null) {
  const savedCallback = useRef<Callback | undefined>(undefined);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    function tick() {
      if (savedCallback.current) {
        savedCallback.current();
      }
    }

    if (delay !== null) {
      const id = setInterval(tick, delay);
      
      return () => clearInterval(id);
    }
  }, [delay]);
}