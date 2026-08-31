import { asc, desc, eq } from "drizzle-orm";
import {
  claims,
  db,
  friends,
  games,
  payments,
  type Claim,
  type Friend,
  type Game,
  type Payment,
} from "./db";

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

export type FriendLedger = {
  friend: Friend;
  /** Games this friend claimed (the charges), oldest first. */
  claimed: { game: Game; claim: Claim }[];
  /** Payments recorded for this friend, newest first. */
  payments: Payment[];
  charged: number;
  paid: number;
  /** charged - paid; negative means they've overpaid. */
  owed: number;
};

/** Every friend with their claimed games, payments, and balance. */
export async function friendLedgers(): Promise<FriendLedger[]> {
  const [friendList, claimRows, paymentRows] = await Promise.all([
    allFriends(),
    db
      .select({ claim: claims, game: games })
      .from(claims)
      .innerJoin(games, eq(games.id, claims.gameId))
      .orderBy(asc(games.startsAt)),
    db.query.payments.findMany({ orderBy: [desc(payments.paidAt), desc(payments.id)] }),
  ]);
  return friendList.map((friend) => {
    const claimed = claimRows.filter((r) => r.claim.friendId === friend.id);
    const friendPayments = paymentRows.filter((p) => p.friendId === friend.id);
    const charged = claimed.reduce((sum, r) => sum + (r.game.price ?? 0), 0);
    const paid = friendPayments.reduce((sum, p) => sum + p.amount, 0);
    return { friend, claimed, payments: friendPayments, charged, paid, owed: charged - paid };
  });
}

