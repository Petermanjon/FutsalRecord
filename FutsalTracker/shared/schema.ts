import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").references(() => teams.id).notNull(),
  name: text("name").notNull(),
  jerseyNumber: integer("jersey_number").notNull(),
  position: text("position").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").references(() => teams.id).notNull(),
  opponent: text("opponent").notNull(),
  venue: text("venue").notNull(),
  competition: text("competition").notNull(),
  matchDate: timestamp("match_date").notNull(),
  format: text("format").notNull(), // "league" or "tournament"
  formatSettings: jsonb("format_settings").notNull(), // stores half duration, number of halves, etc.
  status: text("status").default("scheduled").notNull(), // "scheduled", "live", "finished"
  homeScore: integer("home_score").default(0).notNull(),
  awayScore: integer("away_score").default(0).notNull(),
  currentHalf: integer("current_half").default(1).notNull(),
  currentTime: integer("current_time").default(0).notNull(), // in seconds
  isTimerRunning: boolean("is_timer_running").default(false).notNull(),
  activePlayers: jsonb("active_players").default([]).notNull(), // array of player IDs currently on field
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const matchEvents = pgTable("match_events", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").references(() => matches.id).notNull(),
  playerId: integer("player_id").references(() => players.id),
  eventType: text("event_type").notNull(), // "goal", "foul", "substitution", "timeout", "card"
  eventTime: integer("event_time").notNull(), // in seconds
  half: integer("half").notNull(),
  description: text("description").notNull(),
  metadata: jsonb("metadata").default({}).notNull(), // additional event data
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const playerStats = pgTable("player_stats", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").references(() => matches.id).notNull(),
  playerId: integer("player_id").references(() => players.id).notNull(),
  timeOnField: integer("time_on_field").default(0).notNull(), // in seconds
  goals: integer("goals").default(0).notNull(),
  fouls: integer("fouls").default(0).notNull(),
  isStarter: boolean("is_starter").default(false).notNull(),
  isCurrentlyOnField: boolean("is_currently_on_field").default(false).notNull(),
});

// Insert schemas
export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
});

export const insertPlayerSchema = createInsertSchema(players).omit({
  id: true,
});

export const insertMatchSchema = createInsertSchema(matches).omit({
  id: true,
  createdAt: true,
  status: true,
  homeScore: true,
  awayScore: true,
  currentHalf: true,
  currentTime: true,
  isTimerRunning: true,
  activePlayers: true,
});

export const insertMatchEventSchema = createInsertSchema(matchEvents).omit({
  id: true,
  createdAt: true,
});

export const insertPlayerStatSchema = createInsertSchema(playerStats).omit({
  id: true,
});

// Types
export type Team = typeof teams.$inferSelect;
export type Player = typeof players.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type MatchEvent = typeof matchEvents.$inferSelect;
export type PlayerStat = typeof playerStats.$inferSelect;

export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type InsertMatchEvent = z.infer<typeof insertMatchEventSchema>;
export type InsertPlayerStat = z.infer<typeof insertPlayerStatSchema>;

// Futsal positions
export const futsalPositions = ["Portero", "Cierre", "Pívot", "Ala"] as const;
export type FutsalPosition = typeof futsalPositions[number];
