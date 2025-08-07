import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, UserX } from "lucide-react";
import { type Match, type Player } from "@shared/schema";

interface StartingLineupSelectorProps {
  match: Match | null;
  players: Player[];
  onStartMatch: (starters: number[]) => void;
  onCancel: () => void;
}

export default function StartingLineupSelector({ 
  match, 
  players, 
  onStartMatch, 
  onCancel 
}: StartingLineupSelectorProps) {
  const [selectedStarters, setSelectedStarters] = useState<number[]>([]);
  
  const maxPlayers = match?.format === "league" ? 5 : (match?.formatSettings as any)?.playersOnField || 5;
  
  const togglePlayer = (playerId: number) => {
    if (selectedStarters.includes(playerId)) {
      setSelectedStarters(selectedStarters.filter(id => id !== playerId));
    } else if (selectedStarters.length < maxPlayers) {
      setSelectedStarters([...selectedStarters, playerId]);
    }
  };

  const getPositionColor = (position: string) => {
    switch (position) {
      case "Goalkeeper": return "bg-purple-100 text-purple-800";
      case "Fix": return "bg-blue-100 text-blue-800";
      case "Pivot": return "bg-green-100 text-green-800";
      case "Winger": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">
          Select {maxPlayers} players for starting lineup
        </h3>
        <div className="flex items-center justify-center gap-4">
          <Badge variant="secondary" className="text-sm">
            <Users className="h-4 w-4 mr-1" />
            {selectedStarters.length}/{maxPlayers} selected
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
        {players.map((player) => {
          const isSelected = selectedStarters.includes(player.id);
          const canSelect = !isSelected && selectedStarters.length < maxPlayers;
          
          return (
            <Card
              key={player.id}
              className={`cursor-pointer transition-all ${
                isSelected 
                  ? "border-green-500 bg-green-50" 
                  : canSelect 
                    ? "border-gray-200 hover:border-blue-300 hover:bg-blue-50" 
                    : "border-gray-200 opacity-50"
              }`}
              onClick={() => canSelect || isSelected ? togglePlayer(player.id) : null}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                      isSelected ? "bg-green-600" : "bg-[hsl(207,90%,54%)]"
                    }`}>
                      {player.jerseyNumber}
                    </div>
                    <div>
                      <h4 className="font-semibold">{player.name}</h4>
                      <Badge className={`text-xs ${getPositionColor(player.position)}`}>
                        {player.position}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {isSelected ? (
                      <UserCheck className="h-6 w-6 text-green-600" />
                    ) : canSelect ? (
                      <UserX className="h-6 w-6 text-gray-400" />
                    ) : (
                      <UserX className="h-6 w-6 text-gray-300" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={() => onStartMatch(selectedStarters)}
          disabled={selectedStarters.length !== maxPlayers}
          className="bg-green-600 hover:bg-green-700"
        >
          Start Match ({selectedStarters.length}/{maxPlayers})
        </Button>
      </div>
    </div>
  );
}