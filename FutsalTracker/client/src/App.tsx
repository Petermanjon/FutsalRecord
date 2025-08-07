import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Settings, UserCircle, Users, Calendar, PlayCircle, Plus, Volleyball } from "lucide-react";
import TeamsPage from "@/pages/teams";
import MatchesPage from "@/pages/matches";
import LiveMatchPage from "@/pages/live-match";

function AppHeader() {
  return (
    <header className="bg-[hsl(207,90%,54%)] text-white shadow-lg sticky top-0 z-50">
      <div className="px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Volleyball className="h-6 w-6 md:h-8 md:w-8" />
          <h1 className="text-lg md:text-xl font-bold">Gestor de Fútbol Sala</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" className="touch-friendly p-3 rounded-full hover:bg-blue-700 text-white">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}

function MainApp() {
  const [activeTab, setActiveTab] = useState("teams");

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <div className="p-2 md:p-4">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-auto p-0 bg-transparent">
              <TabsTrigger 
                value="teams" 
                className="py-4 px-3 md:px-6 text-sm md:text-base touch-friendly data-[state=active]:bg-[hsl(207,90%,54%)] data-[state=active]:text-white font-medium flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Equipos</span>
                <span className="sm:hidden">Teams</span>
              </TabsTrigger>
              <TabsTrigger 
                value="matches" 
                className="py-4 px-3 md:px-6 text-sm md:text-base touch-friendly data-[state=active]:bg-[hsl(207,90%,54%)] data-[state=active]:text-white font-medium flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Partidos</span>
                <span className="sm:hidden">Partidos</span>
              </TabsTrigger>
              <TabsTrigger 
                value="live" 
                className="py-4 px-3 md:px-6 text-sm md:text-base touch-friendly data-[state=active]:bg-[hsl(207,90%,54%)] data-[state=active]:text-white font-medium flex items-center gap-2"
              >
                <PlayCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Partido en Vivo</span>
                <span className="sm:hidden">En Vivo</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="teams" className="p-0 mt-0">
              <TeamsPage />
            </TabsContent>
            
            <TabsContent value="matches" className="p-0 mt-0">
              <MatchesPage />
            </TabsContent>
            
            <TabsContent value="live" className="p-0 mt-0">
              <LiveMatchPage />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Switch>
          <Route path="/" component={MainApp} />
          <Route component={NotFound} />
        </Switch>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
