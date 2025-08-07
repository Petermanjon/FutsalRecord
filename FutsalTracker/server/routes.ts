import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { insertTeamSchema, insertPlayerSchema, insertMatchSchema, insertMatchEventSchema, insertPlayerStatSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Serve static files including service worker and manifest
  app.use('/manifest.json', (req, res) => {
    res.sendFile('client/public/manifest.json', { root: process.cwd() });
  });
  
  app.use('/sw.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile('sw.js', { root: process.cwd() });
  });
  
  app.use('/icon-192.png', (req, res) => {
    res.sendFile('client/public/icon-192.png', { root: process.cwd() });
  });
  
  app.use('/icon-512.png', (req, res) => {
    res.sendFile('client/public/icon-512.png', { root: process.cwd() });
  });

  // Teams
  app.get("/api/teams", async (req, res) => {
    try {
      const teams = await storage.getTeams();
      res.json(teams);
    } catch (error) {
      res.status(500).json({ message: "Failed to get teams" });
    }
  });

  app.post("/api/teams", async (req, res) => {
    try {
      const teamData = insertTeamSchema.parse(req.body);
      const team = await storage.createTeam(teamData);
      res.json(team);
    } catch (error) {
      res.status(400).json({ message: "Invalid team data" });
    }
  });

  app.delete("/api/teams/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`Attempting to delete team with ID: ${id}`);
      await storage.deleteTeam(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete team error details:", error);
      res.status(500).json({ 
        message: "Failed to delete team",
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  });

  // Players
  app.get("/api/players", async (req, res) => {
    try {
      const allPlayers = [];
      for (const team of await storage.getTeams()) {
        const teamPlayers = await storage.getPlayersByTeam(team.id);
        allPlayers.push(...teamPlayers);
      }
      res.json(allPlayers);
    } catch (error) {
      res.status(500).json({ message: "Failed to get all players" });
    }
  });

  app.get("/api/teams/:teamId/players", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const players = await storage.getPlayersByTeam(teamId);
      res.json(players);
    } catch (error) {
      res.status(500).json({ message: "Failed to get players" });
    }
  });

  app.post("/api/players", async (req, res) => {
    try {
      const playerData = insertPlayerSchema.parse(req.body);
      const player = await storage.createPlayer(playerData);
      res.json(player);
    } catch (error) {
      res.status(400).json({ message: "Invalid player data" });
    }
  });

  app.put("/api/players/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const player = await storage.updatePlayer(id, updates);
      res.json(player);
    } catch (error) {
      res.status(500).json({ message: "Failed to update player" });
    }
  });

  app.delete("/api/players/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`Attempting to delete player with ID: ${id}`);
      await storage.deletePlayer(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete player error details:", error);
      res.status(500).json({ 
        message: "Failed to delete player", 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  });

  // Matches
  app.get("/api/matches", async (req, res) => {
    try {
      const matches = await storage.getMatches();
      res.json(matches);
    } catch (error) {
      res.status(500).json({ message: "Failed to get matches" });
    }
  });

  app.get("/api/teams/:teamId/matches", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const matches = await storage.getMatchesByTeam(teamId);
      res.json(matches);
    } catch (error) {
      res.status(500).json({ message: "Failed to get team matches" });
    }
  });

  app.get("/api/matches/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const match = await storage.getMatch(id);
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }
      res.json(match);
    } catch (error) {
      res.status(500).json({ message: "Failed to get match" });
    }
  });

  app.post("/api/matches", async (req, res) => {
    try {
      console.log("Received match data:", JSON.stringify(req.body, null, 2));
      
      // Transform the matchDate from string to Date before validation
      const transformedData = {
        ...req.body,
        matchDate: new Date(req.body.matchDate)
      };
      
      const matchData = insertMatchSchema.parse(transformedData);
      const match = await storage.createMatch(matchData);
      res.json(match);
    } catch (error) {
      console.log("Match validation error:", error);
      res.status(400).json({ message: "Invalid match data", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.put("/api/matches/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      // Don't validate with insertMatchSchema for updates, just pass the updates directly
      const match = await storage.updateMatch(id, updates);
      
      // Broadcast match update via WebSocket
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'matchUpdate',
            data: match
          }));
        }
      });
      
      res.json(match);
    } catch (error) {
      console.error("Update match error:", error);
      res.status(500).json({ message: "Failed to update match" });
    }
  });

  // Match Events
  app.get("/api/matches/:id/events", async (req, res) => {
    try {
      const matchId = parseInt(req.params.id);
      const events = await storage.getMatchEvents(matchId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to get match events" });
    }
  });

  app.post("/api/match-events", async (req, res) => {
    try {
      const eventData = insertMatchEventSchema.parse(req.body);
      const event = await storage.createMatchEvent(eventData);
      
      // Broadcast new event via WebSocket
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'newEvent',
            data: event
          }));
        }
      });
      
      res.json(event);
    } catch (error) {
      res.status(400).json({ message: "Invalid event data" });
    }
  });

  // Player Stats
  app.get("/api/matches/:id/stats", async (req, res) => {
    try {
      const matchId = parseInt(req.params.id);
      const stats = await storage.getPlayerStats(matchId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get player stats" });
    }
  });

  app.get("/api/player-stats", async (req, res) => {
    try {
      const matchId = req.query.matchId ? parseInt(req.query.matchId as string) : undefined;
      if (matchId) {
        const stats = await storage.getPlayerStats(matchId);
        res.json(stats);
      } else {
        res.status(400).json({ message: "matchId query parameter is required" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to get player stats" });
    }
  });

  app.post("/api/player-stats", async (req, res) => {
    try {
      const statData = insertPlayerStatSchema.parse(req.body);
      const stat = await storage.createPlayerStat(statData);
      res.json(stat);
    } catch (error) {
      res.status(400).json({ message: "Invalid stat data" });
    }
  });

  app.put("/api/player-stats/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const stat = await storage.updatePlayerStat(id, updates);
      res.json(stat);
    } catch (error) {
      res.status(400).json({ message: "Failed to update player stat" });
    }
  });

  app.put("/api/player-stats/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const stat = await storage.updatePlayerStat(id, updates);
      res.json(stat);
    } catch (error) {
      res.status(500).json({ message: "Failed to update player stat" });
    }
  });

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
    
    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
  });

  return httpServer;
}
