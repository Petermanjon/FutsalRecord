import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Play, Pause, Clock, Square, Target, AlertTriangle, 
  ArrowLeftRight, CreditCard, Users, PlayCircle, 
  Timer, Plus, Minus, UserCheck, UserX
} from "lucide-react";
import { type Match, type Player, type MatchEvent, type PlayerStat, type Team } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

const eventSchema = z.object({
  playerId: z.coerce.number().optional(),
  eventType: z.string(),
  description: z.string(),
});

export default function LiveMatchPage() {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [showStartingLineup, setShowStartingLineup] = useState(false);
  const [showSubstitution, setShowSubstitution] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [startingPlayers, setStartingPlayers] = useState<number[]>([]);
  const [currentMinute, setCurrentMinute] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const { data: matches = [] } = useQuery<Match[]>({
    queryKey: ["/api/matches"],
  });

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const { data: players = [] } = useQuery<Player[]>({
    queryKey: ["/api/players"],
    enabled: !!selectedMatch,
  });

  const { data: playerStats = [] } = useQuery<PlayerStat[]>({
    queryKey: ["/api/player-stats", selectedMatch?.id],
    enabled: !!selectedMatch,
  });

  const updateMatchMutation = useMutation({
    mutationFn: (updates: Partial<Match>) =>
      apiRequest("PUT", `/api/matches/${selectedMatch?.id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
    },
  });

  const createEventMutation = useMutation({
    mutationFn: (event: any) =>
      apiRequest("POST", "/api/match-events", {
        matchId: selectedMatch?.id,
        ...event,
        eventTime: currentMinute,
        half: selectedMatch?.currentHalf || 1,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/match-events"] });
      toast({
        title: "Evento registrado",
        description: "El evento se ha añadido al partido",
      });
    },
  });

  const createPlayerStatMutation = useMutation({
    mutationFn: (stat: any) =>
      apiRequest("POST", "/api/player-stats", {
        matchId: selectedMatch?.id,
        ...stat,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/player-stats"] });
    },
  });

  // Timer management
  useEffect(() => {
    if (isTimerRunning) {
      const interval = setInterval(() => {
        setCurrentMinute(prev => {
          const newMinute = prev + 1;
          if (selectedMatch) {
            updateMatchMutation.mutate({ 
              currentTime: newMinute,
              isTimerRunning: true 
            });
          }
          return newMinute;
        });
      }, 60000); // Update every minute
      setTimerInterval(interval);
    } else {
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
    }

    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [isTimerRunning, selectedMatch]);

  const formatTime = (minutes: number) => {
    const mins = Math.floor(minutes);
    const secs = Math.floor((minutes % 1) * 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startMatch = () => {
    if (!selectedMatch || startingPlayers.length < 5) {
      toast({
        title: "Error",
        description: "Debes seleccionar al menos 5 jugadores para comenzar",
        variant: "destructive",
      });
      return;
    }

    // Create player stats for starting players
    startingPlayers.forEach(playerId => {
      createPlayerStatMutation.mutate({
        playerId,
        isStarter: true,
        isCurrentlyOnField: true,
        timeOnField: 0,
        goals: 0,
        fouls: 0,
      });
    });

    updateMatchMutation.mutate({
      status: "in_progress",
      startedAt: new Date(),
      currentTime: 0,
      isTimerRunning: true,
      activePlayers: startingPlayers,
    });

    setCurrentMinute(0);
    setIsTimerRunning(true);
    setShowStartingLineup(false);
    
    toast({
      title: "¡Partido iniciado!",
      description: "El cronómetro está en marcha",
    });
  };

  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
    updateMatchMutation.mutate({ 
      isTimerRunning: !isTimerRunning,
      currentTime: currentMinute 
    });
  };

  const endMatch = () => {
    setIsTimerRunning(false);
    updateMatchMutation.mutate({
      status: "finished",
      endedAt: new Date(),
      isTimerRunning: false,
    });
    
    toast({
      title: "Partido finalizado",
      description: "Los datos han sido guardados",
    });
  };

  const addGoal = (playerId: number) => {
    createEventMutation.mutate({
      playerId,
      eventType: "goal",
      description: `Gol de ${players.find(p => p.id === playerId)?.name}`,
    });

    // Update match score
    const currentScore = selectedMatch?.homeScore || 0;
    updateMatchMutation.mutate({
      homeScore: currentScore + 1
    });
  };

  const addCard = (playerId: number, cardType: "yellow" | "red") => {
    createEventMutation.mutate({
      playerId,
      eventType: cardType + "_card",
      description: `Tarjeta ${cardType === "yellow" ? "amarilla" : "roja"} para ${players.find(p => p.id === playerId)?.name}`,
    });
  };

  const makeSubstitution = (playerOutId: number, playerInId: number) => {
    // Record substitution event
    createEventMutation.mutate({
      eventType: "substitution",
      description: `Cambio: Sale ${players.find(p => p.id === playerOutId)?.name}, entra ${players.find(p => p.id === playerInId)?.name}`,
      metadata: { playerOut: playerOutId, playerIn: playerInId },
    });

    // Update active players
    const activePlayers = Array.isArray(selectedMatch?.activePlayers) ? selectedMatch.activePlayers : [];
    const newActivePlayers = activePlayers
      .map((id: number) => id === playerOutId ? playerInId : id);
    
    updateMatchMutation.mutate({
      activePlayers: newActivePlayers
    });

    setShowSubstitution(false);
    setSelectedPlayer(null);
    
    toast({
      title: "Cambio realizado",
      description: "Los jugadores han sido sustituidos",
    });
  };

  const teamPlayers = players.filter(p => p.teamId === selectedMatch?.teamId);
  const activePlayerIds = Array.isArray(selectedMatch?.activePlayers) ? selectedMatch.activePlayers as number[] : [];
  const activePlayers = teamPlayers.filter(p => 
    activePlayerIds.includes(p.id)
  );
  const benchPlayers = teamPlayers.filter(p => 
    !activePlayerIds.includes(p.id)
  );

  if (!selectedMatch) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Partido en Vivo</h1>
        </div>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Seleccionar Partido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {matches.filter(m => m.status === "scheduled").map(match => {
                  const team = teams.find(t => t.id === match.teamId);
                  return (
                    <div
                      key={match.id}
                      className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => {
                        setSelectedMatch(match);
                        setShowStartingLineup(true);
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold">{team?.name} vs {match.opponent}</h3>
                          <p className="text-sm text-gray-600">{match.venue}</p>
                          <p className="text-xs text-gray-500">{match.competition}</p>
                        </div>
                        <Button size="sm">
                          <PlayCircle className="h-4 w-4 mr-1" />
                          Iniciar
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (showStartingLineup) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Seleccionar Jugadores Iniciales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-4">
                Selecciona los jugadores que comenzarán el partido (mínimo 5 jugadores)
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {teamPlayers.map(player => (
                  <div
                    key={player.id}
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      startingPlayers.includes(player.id)
                        ? 'bg-blue-100 border-blue-500'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      if (startingPlayers.includes(player.id)) {
                        setStartingPlayers(prev => prev.filter(id => id !== player.id));
                      } else {
                        setStartingPlayers(prev => [...prev, player.id]);
                      }
                    }}
                  >
                    <div className="text-center">
                      <div className="font-semibold">{player.name}</div>
                      <div className="text-sm text-gray-600">#{player.jerseyNumber}</div>
                      <div className="text-xs text-gray-500">{player.position}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Jugadores seleccionados: {startingPlayers.length}
              </div>
              <div className="space-x-2">
                <Button variant="outline" onClick={() => setShowStartingLineup(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={startMatch}
                  disabled={startingPlayers.length < 5}
                >
                  Comenzar Partido
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const team = teams.find(t => t.id === selectedMatch.teamId);

  return (
    <div className="container mx-auto p-4">
      {/* Match Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl">
                {team?.name} vs {selectedMatch.opponent}
              </CardTitle>
              <p className="text-sm text-gray-600">{selectedMatch.venue}</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">
                {selectedMatch.homeScore} - {selectedMatch.awayScore}
              </div>
              <div className="text-lg font-mono">
                {formatTime(currentMinute)}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Timer Controls */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex justify-center space-x-4">
            <Button
              onClick={toggleTimer}
              variant={isTimerRunning ? "destructive" : "default"}
              size="lg"
            >
              {isTimerRunning ? (
                <>
                  <Pause className="h-5 w-5 mr-2" />
                  Pausar
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  Reanudar
                </>
              )}
            </Button>
            
            <Button onClick={endMatch} variant="outline" size="lg">
              <Square className="h-5 w-5 mr-2" />
              Finalizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Players */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Jugadores en Campo ({activePlayers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {activePlayers.map(player => (
              <Card 
                key={player.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setSelectedPlayer(player);
                  setShowSubstitution(true);
                }}
              >
                <CardContent className="p-4 text-center">
                  <div className="font-semibold">{player.name}</div>
                  <div className="text-sm text-gray-600">#{player.jerseyNumber}</div>
                  <div className="text-xs text-gray-500">{player.position}</div>
                  
                  <div className="mt-3 space-y-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        addGoal(player.id);
                      }}
                    >
                      <Target className="h-4 w-4 mr-1" />
                      Gol
                    </Button>
                    
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          addCard(player.id, "yellow");
                        }}
                      >
                        <CreditCard className="h-4 w-4" style={{color: "#fbbf24"}} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          addCard(player.id, "red");
                        }}
                      >
                        <CreditCard className="h-4 w-4" style={{color: "#ef4444"}} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bench Players */}
      {benchPlayers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserCheck className="h-5 w-5 mr-2" />
              Banquillo ({benchPlayers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {benchPlayers.map(player => (
                <Card key={player.id} className="opacity-75">
                  <CardContent className="p-4 text-center">
                    <div className="font-semibold">{player.name}</div>
                    <div className="text-sm text-gray-600">#{player.jerseyNumber}</div>
                    <div className="text-xs text-gray-500">{player.position}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Substitution Dialog */}
      <Dialog open={showSubstitution} onOpenChange={setShowSubstitution}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Realizar Cambio</DialogTitle>
          </DialogHeader>
          
          {selectedPlayer && (
            <div className="space-y-4">
              <div className="text-center p-4 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">Jugador que sale:</p>
                <p className="font-semibold">{selectedPlayer.name} #{selectedPlayer.jerseyNumber}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-2">Seleccionar jugador que entra:</p>
                <div className="grid grid-cols-2 gap-2">
                  {benchPlayers.map(player => (
                    <Button
                      key={player.id}
                      variant="outline"
                      className="h-auto p-3"
                      onClick={() => makeSubstitution(selectedPlayer.id, player.id)}
                    >
                      <div className="text-center">
                        <div className="font-semibold">{player.name}</div>
                        <div className="text-sm text-gray-600">#{player.jerseyNumber}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}