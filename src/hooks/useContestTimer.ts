import { useState, useEffect, useRef } from 'react';

export interface UseContestTimerProps {
  startTime?: string;
  endTime?: string;
  serverTime?: string;
  onExpire?: () => void;
}

export function useContestTimer({
  endTime,
  serverTime,
  onExpire,
}: UseContestTimerProps) {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [isUrgent, setIsUrgent] = useState<boolean>(false); // under 5 min
  const serverOffsetRef = useRef<number>(0);
  const hasExpiredFiredRef = useRef<boolean>(false);

  useEffect(() => {
    if (serverTime) {
      const serverDate = new Date(serverTime).getTime();
      const localDate = Date.now();
      serverOffsetRef.current = serverDate - localDate;
    }
  }, [serverTime]);

  useEffect(() => {
    if (!endTime) return;

    const targetTime = new Date(endTime).getTime();

    const calculateTime = () => {
      const currentAuthoritativeTime = Date.now() + serverOffsetRef.current;
      const diff = Math.max(0, Math.floor((targetTime - currentAuthoritativeTime) / 1000));

      setSecondsRemaining(diff);
      setIsUrgent(diff > 0 && diff <= 300); // 5 minutes

      if (diff <= 0 && !hasExpiredFiredRef.current) {
        hasExpiredFiredRef.current = true;
        setIsExpired(true);
        if (onExpire) onExpire();
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [endTime, onExpire]);

  const hours = Math.floor(secondsRemaining / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);
  const seconds = secondsRemaining % 60;

  const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return {
    secondsRemaining,
    formatted,
    isExpired,
    isUrgent,
  };
}
