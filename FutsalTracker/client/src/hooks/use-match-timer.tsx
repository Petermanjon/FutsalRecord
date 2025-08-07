import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type Match } from "@shared/schema";

export function useMatchTimer(match: Match | null) {
  const updateMatchMutation = useMutation({
    mutationFn: (updates: Partial<Match>) =>
      apiRequest("PUT", `/api/matches/${match?.id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
    },
  });

  // Timer effect
  useEffect(() => {
    if (!match || !match.isTimerRunning) return;

    const interval = setInterval(() => {
      const newTime = match.currentTime + 1;
      updateMatchMutation.mutate({ currentTime: newTime });
    }, 1000);

    return () => clearInterval(interval);
  }, [match?.isTimerRunning, match?.currentTime, updateMatchMutation]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return {
    formatTime,
  };
}
