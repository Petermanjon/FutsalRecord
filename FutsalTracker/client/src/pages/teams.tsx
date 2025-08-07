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
import { Plus, Edit, Trash2, UserPlus } from "lucide-react";
import { type Team, type Player, futsalPositions } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import PlayerCard from "@/components/player-card";

const teamSchema = z.object({
  name: z.string().min(1, "El nombre del equipo es obligatorio"),
});

const playerSchema = z.object({
  name: z.string().min(1, "El nombre del jugador es obligatorio"),
  jerseyNumber: z.coerce.number().min(1).max(99),
  position: z.string().min(1, "La posición es obligatoria"),
  teamId: z.number(),
});

export default function TeamsPage() {
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showTeamDialog, setShowTeamDialog] = useState(false);
  const [showPlayerDialog, setShowPlayerDialog] = useState(false);
  const { toast } = useToast();

  const { data: teams = [], isLoading: teamsLoading } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const { data: players = [] } = useQuery<Player[]>({
    queryKey: [`/api/teams/${selectedTeam?.id}/players`],
    enabled: !!selectedTeam?.id,
  });

  // Query to get all players for team counts
  const { data: allPlayers = [] } = useQuery<Player[]>({
    queryKey: ["/api/players"],
    queryFn: async () => {
      const response = await fetch("/api/players");
      if (!response.ok) throw new Error("Failed to fetch players");
      return response.json();
    },
  });

  const createTeamMutation = useMutation({
    mutationFn: (data: z.infer<typeof teamSchema>) =>
      apiRequest("POST", "/api/teams", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      setShowTeamDialog(false);
      toast({ title: "Equipo creado correctamente!" });
    },
  });

  const deleteTeamMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/teams/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      setSelectedTeam(null);
      toast({ title: "Equipo eliminado correctamente!" });
    },
  });

  const createPlayerMutation = useMutation({
    mutationFn: (data: z.infer<typeof playerSchema>) =>
      apiRequest("POST", "/api/players", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/teams/${selectedTeam?.id}/players`] });
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      playerForm.reset({
        name: "",
        jerseyNumber: 1,
        position: "",
        teamId: selectedTeam?.id || 0,
      });
      setShowPlayerDialog(false);
      toast({ title: "Jugador añadido correctamente!" });
    },
  });

  const deletePlayerMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/players/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/teams/${selectedTeam?.id}/players`] });
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      toast({ title: "Jugador eliminado correctamente!" });
    },
  });

  const teamForm = useForm<z.infer<typeof teamSchema>>({
    resolver: zodResolver(teamSchema),
    defaultValues: { name: "" },
  });

  const playerForm = useForm<z.infer<typeof playerSchema>>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      name: "",
      jerseyNumber: 1,
      position: "",
      teamId: 0,
    },
  });

  const onCreateTeam = (data: z.infer<typeof teamSchema>) => {
    createTeamMutation.mutate(data);
  };

  const onCreatePlayer = (data: z.infer<typeof playerSchema>) => {
    if (!selectedTeam) return;
    console.log("Creating player:", data);
    createPlayerMutation.mutate({ ...data, teamId: selectedTeam.id });
  };

  const usedJerseyNumbers = players.map(p => p.jerseyNumber);

  return (
    <div className="space-y-6">
      {/* Team Creation Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-[hsl(203,23%,30%)]">Mis Equipos</CardTitle>
            <Dialog open={showTeamDialog} onOpenChange={setShowTeamDialog}>
              <DialogTrigger asChild>
                <Button className="bg-[hsl(207,90%,54%)] hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Equipo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Equipo</DialogTitle>
                </DialogHeader>
                <Form {...teamForm}>
                  <form onSubmit={teamForm.handleSubmit(onCreateTeam)} className="space-y-4">
                    <FormField
                      control={teamForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre del Equipo</FormLabel>
                          <FormControl>
                            <Input placeholder="Introduce el nombre del equipo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowTeamDialog(false)}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={createTeamMutation.isPending}>
                        Crear Equipo
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {teamsLoading ? (
            <div className="text-center py-8">Cargando equipos...</div>
          ) : teams.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay equipos creados. ¡Crea tu primer equipo!
            </div>
          ) : (
            <div className="space-y-4">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className={`border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
                    selectedTeam?.id === team.id ? 'border-[hsl(207,90%,54%)] bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => setSelectedTeam(team)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-[hsl(207,90%,54%)] rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {team.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{team.name}</h3>
                        <p className="text-gray-600">
                          {allPlayers.filter(p => p.teamId === team.id).length} jugadores
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="outline"
                        className="text-[hsl(122,39%,49%)] border-[hsl(122,39%,49%)] hover:bg-green-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTeam(team);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Gestionar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("¿Estás seguro de que quieres eliminar este equipo?")) {
                            deleteTeamMutation.mutate(team.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Player Management Card */}
      {selectedTeam && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold">
                Jugadores del Equipo - <span className="text-[hsl(207,90%,54%)]">{selectedTeam.name}</span>
              </CardTitle>
              <Dialog open={showPlayerDialog} onOpenChange={setShowPlayerDialog}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-[hsl(33,100%,50%)] hover:bg-orange-600"
                    onClick={() => {
                      playerForm.reset({
                        name: "",
                        jerseyNumber: 1,
                        position: "",
                        teamId: selectedTeam.id,
                      });
                    }}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Añadir Jugador
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Añadir Jugador a {selectedTeam.name}</DialogTitle>
                  </DialogHeader>
                  <Form {...playerForm}>
                    <form onSubmit={playerForm.handleSubmit(onCreatePlayer)} className="space-y-4">
                      <FormField
                        control={playerForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre del Jugador</FormLabel>
                            <FormControl>
                              <Input placeholder="Introduce el nombre del jugador" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={playerForm.control}
                        name="jerseyNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número de Camiseta</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1" 
                                max="99" 
                                placeholder="1-99" 
                                {...field}
                              />
                            </FormControl>
                            {usedJerseyNumbers.includes(Number(field.value)) && (
                              <p className="text-sm text-red-500">Este número ya está ocupado</p>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={playerForm.control}
                        name="position"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Posición</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona una posición" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {futsalPositions.map((position) => (
                                  <SelectItem key={position} value={position}>
                                    {position}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowPlayerDialog(false)}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createPlayerMutation.isPending || usedJerseyNumbers.includes(playerForm.watch("jerseyNumber"))}
                        >
                          Añadir Jugador
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {players.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay jugadores añadidos. ¡Añade tu primer jugador!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {players.map((player) => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    onDelete={() => {
                      if (confirm("¿Estás seguro de que quieres eliminar este jugador?")) {
                        deletePlayerMutation.mutate(player.id);
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
