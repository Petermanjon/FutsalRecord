import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trophy, Medal, Eye } from "lucide-react";
import { type Team, type Match } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

const matchSchema = z.object({
  teamId: z.coerce.number(),
  opponent: z.string().min(1, "El nombre del oponente es obligatorio"),
  venue: z.string().min(1, "El lugar es obligatorio"),
  competition: z.string().min(1, "La competición es obligatoria"),
  matchDate: z.string().min(1, "La fecha del partido es obligatoria"),
  format: z.enum(["league", "tournament"]),
  formatSettings: z.object({
    halfDuration: z.coerce.number().min(1),
    numberOfHalves: z.coerce.number().min(1),
    playersOnField: z.coerce.number().min(1).optional(),
  }),
});

const formatDate = (dateInput: string | Date) => {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export default function MatchesPage() {
  const [selectedFormat, setSelectedFormat] = useState<"league" | "tournament" | null>(null);
  const [showMatchDialog, setShowMatchDialog] = useState(false);
  const { toast } = useToast();

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const { data: matches = [], isLoading: matchesLoading } = useQuery<Match[]>({
    queryKey: ["/api/matches"],
  });

  const createMatchMutation = useMutation({
    mutationFn: (data: z.infer<typeof matchSchema>) =>
      apiRequest("POST", "/api/matches", {
        ...data,
        matchDate: new Date(data.matchDate).toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      setShowMatchDialog(false);
      setSelectedFormat(null);
      toast({ title: "Partido creado correctamente!" });
    },
  });

  const matchForm = useForm<z.infer<typeof matchSchema>>({
    resolver: zodResolver(matchSchema),
    defaultValues: {
      teamId: 0,
      opponent: "",
      venue: "",
      competition: "",
      matchDate: "",
      format: "league",
      formatSettings: {
        halfDuration: 25,
        numberOfHalves: 2,
        playersOnField: 5,
      },
    },
  });

  const onCreateMatch = (data: z.infer<typeof matchSchema>) => {
    createMatchMutation.mutate(data);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getResultBadge = (match: Match) => {
    if (match.status === "scheduled") return null;
    
    const isWin = match.homeScore > match.awayScore;
    const isDraw = match.homeScore === match.awayScore;
    
    if (isWin) {
      return <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">Ganado</span>;
    } else if (isDraw) {
      return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm font-medium">Empate</span>;
    } else {
      return <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-medium">Perdido</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Match Creation Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-[hsl(203,23%,30%)]">Gestión de Partidos</CardTitle>
            <Dialog open={showMatchDialog} onOpenChange={setShowMatchDialog}>
              <DialogTrigger asChild>
                <Button className="bg-[hsl(207,90%,54%)] hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Partido
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Partido</DialogTitle>
                </DialogHeader>
                
                {!selectedFormat ? (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold">Selecciona el Formato del Partido</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div
                        className="border-2 border-[hsl(207,90%,54%)] rounded-lg p-6 bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors"
                        onClick={() => {
                          setSelectedFormat("league");
                          matchForm.setValue("format", "league");
                          matchForm.setValue("formatSettings", {
                            halfDuration: 25,
                            numberOfHalves: 2,
                            playersOnField: 5,
                          });
                        }}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-[hsl(207,90%,54%)]">Formato Liga</h4>
                          <Trophy className="text-[hsl(207,90%,54%)] h-6 w-6" />
                        </div>
                        <div className="space-y-2 text-sm text-gray-700">
                          <p>• 25 minutos por parte</p>
                          <p>• 2 partes</p>
                          <p>• Posiciones de fútbol sala (Portero, Fijo, Pívot, Alas)</p>
                        </div>
                      </div>
                      
                      <div
                        className="border-2 border-gray-300 rounded-lg p-6 cursor-pointer hover:border-[hsl(207,90%,54%)] hover:bg-blue-50 transition-colors"
                        onClick={() => {
                          setSelectedFormat("tournament");
                          matchForm.setValue("format", "tournament");
                          matchForm.setValue("formatSettings", {
                            halfDuration: 20,
                            numberOfHalves: 2,
                            playersOnField: 5,
                          });
                        }}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-gray-700">Formato Torneo</h4>
                          <Medal className="text-gray-400 h-6 w-6" />
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                          <p>• Duración de parte personalizable</p>
                          <p>• Número de partes flexible</p>
                          <p>• Número de jugadores personalizable</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Form {...matchForm}>
                    <form onSubmit={matchForm.handleSubmit(onCreateMatch)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={matchForm.control}
                          name="teamId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tu Equipo</FormLabel>
                              <Select onValueChange={(value) => field.onChange(Number(value))}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecciona tu equipo" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {teams.map((team) => (
                                    <SelectItem key={team.id} value={team.id.toString()}>
                                      {team.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={matchForm.control}
                          name="opponent"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Equipo Rival</FormLabel>
                              <FormControl>
                                <Input placeholder="Introduce el nombre del rival" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={matchForm.control}
                          name="matchDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Fecha del Partido</FormLabel>
                              <FormControl>
                                <Input type="datetime-local" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={matchForm.control}
                          name="venue"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Lugar</FormLabel>
                              <FormControl>
                                <Input placeholder="Ubicación del partido" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={matchForm.control}
                          name="competition"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Competición</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecciona la competición" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Liga Local">Liga Local</SelectItem>
                                  <SelectItem value="Torneo de Copa">Torneo de Copa</SelectItem>
                                  <SelectItem value="Partido Amistoso">Partido Amistoso</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      {selectedFormat === "tournament" && (
                        <div className="space-y-4 border-t pt-4">
                          <h4 className="font-semibold">Tournament Settings</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                              control={matchForm.control}
                              name="formatSettings.halfDuration"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Half Duration (minutes)</FormLabel>
                                  <FormControl>
                                    <Input type="number" min="1" placeholder="20" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={matchForm.control}
                              name="formatSettings.numberOfHalves"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Number of Halves</FormLabel>
                                  <FormControl>
                                    <Input type="number" min="1" placeholder="2" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={matchForm.control}
                              name="formatSettings.playersOnField"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Players on Field</FormLabel>
                                  <FormControl>
                                    <Input type="number" min="1" placeholder="5" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-end space-x-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowMatchDialog(false);
                            setSelectedFormat(null);
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setSelectedFormat(null)}
                        >
                          Atrás
                        </Button>
                        <Button type="submit" disabled={createMatchMutation.isPending}>
                          Crear Partido
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Recent Matches */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">Partidos Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {matchesLoading ? (
            <div className="text-center py-8">Cargando partidos...</div>
          ) : matches.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay partidos creados. ¡Crea tu primer partido!
            </div>
          ) : (
            <div className="space-y-4">
              {matches.map((match) => {
                const team = teams.find(t => t.id === match.teamId);
                return (
                  <div
                    key={match.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex flex-col items-center">
                          <div className="text-2xl font-bold text-[hsl(207,90%,54%)]">
                            {match.homeScore}
                          </div>
                          <div className="text-xs text-gray-500">US</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-500">vs</div>
                          <div className="text-xs text-gray-400">
                            {typeof match.matchDate === 'string' ? formatDate(match.matchDate) : formatDate(match.matchDate.toString())}
                          </div>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="text-2xl font-bold text-gray-600">
                            {match.awayScore}
                          </div>
                          <div className="text-xs text-gray-500">THEM</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {getResultBadge(match)}
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-gray-600">
                      <span>{match.opponent}</span> • 
                      <span className="ml-1">{match.venue}</span> • 
                      <span className="ml-1 capitalize">{match.format}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
