import { 
  teams, players, matches, matchEvents, playerStats,
  type Team, type Player, type Match, type MatchEvent, type PlayerStat,
  type InsertTeam, type InsertPlayer, type InsertMatch, type InsertMatchEvent, type InsertPlayerStat
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // Teams
  getTeams(): Promise<Team[]>;
  getTeam(id: number): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  deleteTeam(id: number): Promise<void>;

  // Players
  getPlayersByTeam(teamId: number): Promise<Player[]>;
  getPlayer(id: number): Promise<Player | undefined>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  updatePlayer(id: number, updates: Partial<Player>): Promise<Player>;
  deletePlayer(id: number): Promise<void>;

  // Matches
  getMatches(): Promise<Match[]>;
  getMatchesByTeam(teamId: number): Promise<Match[]>;
  getMatch(id: number): Promise<Match | undefined>;
  createMatch(match: InsertMatch): Promise<Match>;
  updateMatch(id: number, updates: Partial<Match>): Promise<Match>;
  deleteMatch(id: number): Promise<void>;

  // Match Events
  getMatchEvents(matchId: number): Promise<MatchEvent[]>;
  createMatchEvent(event: InsertMatchEvent): Promise<MatchEvent>;

  // Player Stats
  getPlayerStats(matchId: number): Promise<PlayerStat[]>;
  getPlayerStat(matchId: number, playerId: number): Promise<PlayerStat | undefined>;
  createPlayerStat(stat: InsertPlayerStat): Promise<PlayerStat>;
  updatePlayerStat(id: number, updates: Partial<PlayerStat>): Promise<PlayerStat>;
}

export class DatabaseStorage implements IStorage {
  // Teams
  async getTeams(): Promise<Team[]> {
    return await db.select().from(teams).where(eq(teams.isActive, true));
  }

  async getTeam(id: number): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team || undefined;
  }

  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const [team] = await db
      .insert(teams)
      .values(insertTeam)
      .returning();
    return team;
  }

  async deleteTeam(id: number): Promise<void> {
    // Soft delete - mark team as inactive and all its players as inactive
    await db.transaction(async (tx) => {
      // Mark all players of this team as inactive
      await tx.update(players)
        .set({ isActive: false })
        .where(eq(players.teamId, id));
      
      // Mark the team as inactive
      const [updatedTeam] = await tx.update(teams)
        .set({ isActive: false })
        .where(eq(teams.id, id))
        .returning();
        
      if (!updatedTeam) {
        throw new Error(`Team with ID ${id} not found`);
      }
    });
  }

  // Players
  async getPlayersByTeam(teamId: number): Promise<Player[]> {
    return await db.select().from(players).where(
      and(eq(players.teamId, teamId), eq(players.isActive, true))
    );
  }

  async getPlayer(id: number): Promise<Player | undefined> {
    const [player] = await db.select().from(players).where(eq(players.id, id));
    return player || undefined;
  }

  async createPlayer(insertPlayer: InsertPlayer): Promise<Player> {
    const [player] = await db
      .insert(players)
      .values(insertPlayer)
      .returning();
    return player;
  }

  async updatePlayer(id: number, updates: Partial<Player>): Promise<Player> {
    const [player] = await db
      .update(players)
      .set(updates)
      .where(eq(players.id, id))
      .returning();
    if (!player) throw new Error(`Player ${id} not found`);
    return player;
  }

  async deletePlayer(id: number): Promise<void> {
    // Soft delete - mark player as inactive instead of physically deleting
    const [updatedPlayer] = await db.update(players)
      .set({ isActive: false })
      .where(eq(players.id, id))
      .returning();
      
    if (!updatedPlayer) {
      throw new Error(`Player with ID ${id} not found`);
    }
  }

  // Matches
  async getMatches(): Promise<Match[]> {
    return await db.select().from(matches);
  }

  async getMatchesByTeam(teamId: number): Promise<Match[]> {
    return await db.select().from(matches).where(eq(matches.teamId, teamId));
  }

  async getMatch(id: number): Promise<Match | undefined> {
    const [match] = await db.select().from(matches).where(eq(matches.id, id));
    return match || undefined;
  }

  async createMatch(insertMatch: InsertMatch): Promise<Match> {
    const [match] = await db
      .insert(matches)
      .values(insertMatch)
      .returning();
    return match;
  }

  async updateMatch(id: number, updates: Partial<Match>): Promise<Match> {
    const [match] = await db
      .update(matches)
      .set(updates)
      .where(eq(matches.id, id))
      .returning();
    if (!match) throw new Error(`Match ${id} not found`);
    return match;
  }

  async deleteMatch(id: number): Promise<void> {
    await db.delete(matches).where(eq(matches.id, id));
  }

  // Match Events
  async getMatchEvents(matchId: number): Promise<MatchEvent[]> {
    return await db.select().from(matchEvents).where(eq(matchEvents.matchId, matchId));
  }

  async createMatchEvent(insertEvent: InsertMatchEvent): Promise<MatchEvent> {
    const [event] = await db
      .insert(matchEvents)
      .values(insertEvent)
      .returning();
    return event;
  }

  // Player Stats
  async getPlayerStats(matchId: number): Promise<PlayerStat[]> {
    return await db.select().from(playerStats).where(eq(playerStats.matchId, matchId));
  }

  async getPlayerStat(matchId: number, playerId: number): Promise<PlayerStat | undefined> {
    const [stat] = await db.select().from(playerStats)
      .where(and(eq(playerStats.matchId, matchId), eq(playerStats.playerId, playerId)));
    return stat || undefined;
  }

  async createPlayerStat(insertStat: InsertPlayerStat): Promise<PlayerStat> {
    const [stat] = await db
      .insert(playerStats)
      .values(insertStat)
      .returning();
    return stat;
  }

  async updatePlayerStat(id: number, updates: Partial<PlayerStat>): Promise<PlayerStat> {
    const [stat] = await db
      .update(playerStats)
      .set(updates)
      .where(eq(playerStats.id, id))
      .returning();
    if (!stat) throw new Error(`PlayerStat ${id} not found`);
    return stat;
  }
}

export const storage = new DatabaseStorage();