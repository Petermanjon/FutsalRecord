import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Users, UserCheck, UserX, ArrowRightLeft, Clock } from "lucide-react";
import { type Match, type Player, type PlayerStat } from "@shared/schema";

interface TacticalLineupManagerProps {
  match: Match;
  players: Player[];
  playerStats: PlayerStat[];
  onUpdateLineup: (updates: { playersIn: number[]; playersOut: number[] }) => void;
  onHalfTime: () => void;
  onCancel: () => void;
}

export default function TacticalLineupManager({ 
  match, 
  players, 
  playerStats,
  onUpdateLineup,
  onHalfTime,
  onCancel 
}: TacticalLineupManagerProps) {
  const [pendingChanges, setPendingChanges] = useState<{in: number[], out: number[]}>({
    in: [],
    out: []
  });
  
  const activePlayers = players.filter(p => 
    playerStats.some(s => s.playerId === p.id && s.isCurrentlyOnField)
  );
  
  const benchPlayers = players.filter(p => 
    !playerStats.some(s => s.playerId === p.id && s.isCurrentlyOnField)
  );

  const maxPlayers = match.format === "league" ? 5 : (match.formatSettings as any)?.playersOnField || 5;

  const togglePlayerOut = (playerId: number) => {
    if (pendingChanges.out.includes(playerId)) {
      setPendingChanges(prev => ({
        ...prev,
        out: prev.out.filter(id => id !== playerId)
      }));
    } else {
      setPendingChanges(prev => ({
        ...prev,
        out: [...prev.out, playerId]
      }));
    }
  };

  const togglePlayerIn = (playerId: number) => {
    if (pendingChanges.in.includes(playerId)) {
      setPendingChanges(prev => ({
        ...prev,
        in: prev.in.filter(id => id !== playerId)
      }));
    } else if (pendingChanges.in.length < pendingChanges.out.length) {
      setPendingChanges(prev => ({
        ...prev,
        in: [...prev.in, playerId]
      }));
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

  const getPlayerStat = (playerId: number) => {
    return playerStats.find(s => s.playerId === playerId);
  };

  const canMakeChanges = pendingChanges.out.length > 0 && pendingChanges.out.length === pendingChanges.in.length;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Halftime Break</h3>
        <p className="text-sm text-gray-600 mb-4">Make tactical changes to your lineup or proceed to the next half</p>
        <div className="flex items-center justify-center gap-4 mb-4">
          <Badge variant="secondary" className="text-sm">
            <Users className="h-4 w-4 mr-1" />
            {activePlayers.length} on field
          </Badge>
          {pendingChanges.out.length > 0 && (
            <Badge variant="outline" className="text-sm border-blue-500 text-blue-700">
              <ArrowRightLeft className="h-4 w-4 mr-1" />
              {pendingChanges.out.length} tactical changes
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-96 overflow-y-auto">
        {/* Players on Field */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <Users className="h-4 w-4 mr-2 text-green-600" />
              On Field ({activePlayers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activePlayers.map((player) => {
              const stat = getPlayerStat(player.id);
              const isSelected = pendingChanges.out.includes(player.id);
              
              return (
                <Card
                  key={player.id}
                  className={`cursor-pointer transition-all ${
                    isSelected 
                      ? "border-red-500 bg-red-50" 
                      : "border-gray-200 hover:border-red-300 hover:bg-red-50"
                  }`}
                  onClick={() => togglePlayerOut(player.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                          isSelected ? "bg-red-600" : "bg-green-600"
                        }`}>
                          {player.jerseyNumber}
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">{player.name}</h4>
                          <Badge className={`text-xs ${getPositionColor(player.position)}`}>
                            {player.position}
                          </Badge>
                          <div className="text-xs text-gray-600 mt-1">
                            Goals: {stat?.goals || 0} • Fouls: {stat?.fouls || 0}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {isSelected ? (
                          <UserX className="h-5 w-5 text-red-600" />
                        ) : (
                          <UserCheck className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </CardContent>
        </Card>

        {/* Bench Players */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <Users className="h-4 w-4 mr-2 text-gray-600" />
              Bench ({benchPlayers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {benchPlayers.map((player) => {
              const stat = getPlayerStat(player.id);
              const isSelected = pendingChanges.in.includes(player.id);
              const canSelect = !isSelected && pendingChanges.in.length < pendingChanges.out.length;
              
              return (
                <Card
                  key={player.id}
                  className={`cursor-pointer transition-all ${
                    isSelected 
                      ? "border-green-500 bg-green-50" 
                      : canSelect 
                        ? "border-gray-200 hover:border-green-300 hover:bg-green-50" 
                        : "border-gray-200 opacity-50"
                  }`}
                  onClick={() => canSelect || isSelected ? togglePlayerIn(player.id) : null}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                          isSelected ? "bg-green-600" : "bg-gray-400"
                        }`}>
                          {player.jerseyNumber}
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">{player.name}</h4>
                          <Badge className={`text-xs ${getPositionColor(player.position)}`}>
                            {player.position}
                          </Badge>
                          <div className="text-xs text-gray-600 mt-1">
                            Goals: {stat?.goals || 0} • Fouls: {stat?.fouls || 0}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {isSelected ? (
                          <UserCheck className="h-5 w-5 text-green-600" />
                        ) : canSelect ? (
                          <UserX className="h-5 w-5 text-gray-400" />
                        ) : (
                          <UserX className="h-5 w-5 text-gray-300" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div className="flex flex-col md:flex-row justify-between gap-3 pt-4">
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={onHalfTime}
            variant="outline"
            className="border-gray-600 text-gray-600"
          >
            <Clock className="h-4 w-4 mr-2" />
            Start Next Half
          </Button>
        </div>
        
        <Button
          onClick={() => onUpdateLineup({
            playersIn: pendingChanges.in,
            playersOut: pendingChanges.out
          })}
          disabled={!canMakeChanges}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Apply Changes ({pendingChanges.out.length})
        </Button>
      </div>
    </div>
  );
}