import { asc, eq } from "drizzle-orm";
import { claims, db, friends, games, type Claim, type Friend, type Game } from "./db";

export type GameRow = {
  game: Game;
  claim: (Claim & { friend: Friend }) | null;
};

/** All games (admin), oldest first, with claim + claimer. */
export async function allGames(): Promise<GameRow[]> {
  const rows = await db
    .select({ game: games, claim: claims, friend: friends })
    .from(games)
    .leftJoin(claims, eq(claims.gameId, games.id))
    .leftJoin(friends, eq(friends.id, claims.friendId))
    .orderBy(asc(games.startsAt));
  return rows.map(({ game, claim, friend }) => ({
    game,
    claim: claim && friend ? { ...claim, friend } : null,
  }));
}

/** Non-hidden games that haven't started yet (friend view). */
export async function upcomingVisibleGames(): Promise<GameRow[]> {
  const now = new Date().toISOString();
  const rows = await allGames();
  return rows.filter((r) => r.game.status !== "hidden" && r.game.startsAt > now);
}

export async function allFriends(): Promise<Friend[]> {
  return db.query.friends.findMany({ orderBy: asc(friends.name) });
}

export async function friendByToken(token: string): Promise<Friend | undefined> {
  return db.query.friends.findFirst({ where: eq(friends.token, token) });
}

