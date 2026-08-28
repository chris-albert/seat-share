import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const GAME_STATUSES = ["hidden", "available", "keeping"] as const;
export type GameStatus = (typeof GAME_STATUSES)[number];

export const games = sqliteTable("games", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  mlbGamePk: integer("mlb_game_pk").notNull().unique(),
  /** Local calendar date, YYYY-MM-DD */
  date: text("date").notNull(),
  /** Local start time, e.g. "7:15 PM", or "TBD" */
  time: text("time").notNull(),
  /** UTC ISO timestamp of first pitch (used for ordering / past-game checks) */
  startsAt: text("starts_at").notNull(),
  opponent: text("opponent").notNull(),
  status: text("status", { enum: GAME_STATUSES }).notNull().default("hidden"),
  /** Whole dollars for the whole set of seats; null = free / ask */
  price: integer("price"),
});

export const friends = sqliteTable("friends", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  token: text("token").notNull().unique(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const claims = sqliteTable("claims", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  // UNIQUE here is what makes "first claim wins" safe under concurrent taps.
  gameId: integer("game_id")
    .notNull()
    .unique()
    .references(() => games.id, { onDelete: "cascade" }),
  friendId: integer("friend_id")
    .notNull()
    .references(() => friends.id, { onDelete: "cascade" }),
  claimedAt: text("claimed_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  paid: integer("paid", { mode: "boolean" }).notNull().default(false),
  transferred: integer("transferred", { mode: "boolean" })
    .notNull()
    .default(false),
});

export type Game = typeof games.$inferSelect;
export type Friend = typeof friends.$inferSelect;
export type Claim = typeof claims.$inferSelect;
