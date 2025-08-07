import { Card } from "@/components/ui/card";
import { type Match } from "@shared/schema";
import { useMatchTimer } from "@/hooks/use-match-timer";

interface MatchTimerProps {
  match: Match;
}

export default function MatchTimer({ match }: MatchTimerProps) {
  const { formatTime } = useMatchTimer(match);

  const getHalfText = (half: number) => {
    if (half === 1) return "1st Half";
    if (half === 2) return "2nd Half";
    return `${half}${half === 3 ? 'rd' : 'th'} Half`;
  };

  const getStatusText = (status: string, isRunning: boolean) => {
    if (status === "finished") return "Finished";
    if (isRunning) return "Playing";
    return "Paused";
  };

  const getStatusColor = (status: string, isRunning: boolean) => {
    if (status === "finished") return "text-red-600";
    if (isRunning) return "text-green-600";
    return "text-yellow-600";
  };

  return (
    <Card className="bg-gray-900 text-white rounded-lg p-4 shadow-lg">
      <div className="text-center">
        <div className={`text-3xl md:text-4xl font-bold ${match.isTimerRunning ? 'timer-running text-green-400' : 'text-white'}`}>
          {formatTime(match.currentTime)}
        </div>
        <div className="text-sm md:text-base text-gray-300 mt-2">
          <span className="font-semibold">{getHalfText(match.currentHalf)}</span>
          <span className="mx-3">•</span>
          <span className={`font-bold ${getStatusColor(match.status, match.isTimerRunning)}`}>
            {getStatusText(match.status, match.isTimerRunning)}
          </span>
        </div>
      </div>
    </Card>
  );
}
