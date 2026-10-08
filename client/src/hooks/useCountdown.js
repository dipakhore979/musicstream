import { useCallback, useEffect, useState } from "react";

// Counts down once per second from `initial`. Call restart() to begin again (default 60s).
export function useCountdown(initial = 0) {
  const [seconds, setSeconds] = useState(initial);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  const restart = useCallback((s = 60) => setSeconds(s), []);
  return [seconds, restart];
}
