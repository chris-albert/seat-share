"use server";

import { randomBytes } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { claims, db, friends, games, GAME_STATUSES, type GameStatus } from "./db";
import { clearAdminCookie, isAdmin, passwordMatches, setAdminCookie } from "./auth";

// ---------- friend actions ----------

async function friendByToken(token: string) {
  const friend = await db.query.friends.findFirst({ where: eq(friends.token, token) });
  if (!friend) redirect("/");
  return friend;
}

export async function claimGame(token: string, gameId: number) {
  const friend = await friendByToken(token);
  const game = await db.query.games.findFirst({ where: eq(games.id, gameId) });
  if (!game || game.status !== "available") {
    redirect(`/f/${token}?msg=unavailable`);
  }
  try {
    await db.insert(claims).values({ gameId, friendId: friend.id });
  } catch {
    // UNIQUE(game_id) violated: someone else got there first.
    redirect(`/f/${token}?msg=taken`);
  }
  revalidatePath(`/f/${token}`);
  revalidatePath("/admin");
  redirect(`/f/${token}?msg=claimed#game-${gameId}`);
}

export async function releaseGame(token: string, gameId: number) {
  const friend = await friendByToken(token);
  await db
    .delete(claims)
    .where(and(eq(claims.gameId, gameId), eq(claims.friendId, friend.id)));
  revalidatePath(`/f/${token}`);
  revalidatePath("/admin");
  redirect(`/f/${token}?msg=released#game-${gameId}`);
}

// ---------- admin auth ----------

export async function login(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (!passwordMatches(password)) redirect("/admin/login?error=1");
  await setAdminCookie();
  redirect("/admin");
}

export async function logout() {
  await clearAdminCookie();
  redirect("/admin/login");
}

async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

function revalidateAll() {
  revalidatePath("/admin");
  revalidatePath("/admin/friends");
  revalidatePath("/f/[token]", "page");
}

// ---------- admin: games ----------

export async function setGameStatus(gameId: number, status: GameStatus) {
  await requireAdmin();
  if (!GAME_STATUSES.includes(status)) return;
  await db.update(games).set({ status }).where(eq(games.id, gameId));
  revalidateAll();
}

export async function setGamePrice(gameId: number, formData: FormData) {
  await requireAdmin();
  const raw = String(formData.get("price") ?? "").trim();
  const price = raw === "" ? null : Math.max(0, Math.round(Number(raw)));
  if (price !== null && Number.isNaN(price)) return;
  await db.update(games).set({ price }).where(eq(games.id, gameId));
  revalidateAll();
}

/** Bulk: every hidden game that hasn't started yet becomes available. */
export async function offerAllHiddenUpcoming() {
  await requireAdmin();
  const now = new Date().toISOString();
  const rows = await db.query.games.findMany({ where: eq(games.status, "hidden") });
  const ids = rows.filter((g) => g.startsAt > now).map((g) => g.id);
  if (ids.length) {
    await db.update(games).set({ status: "available" }).where(inArray(games.id, ids));
  }
  revalidateAll();
}

export async function unclaimGame(gameId: number) {
  await requireAdmin();
  await db.delete(claims).where(eq(claims.gameId, gameId));
  revalidateAll();
}

export async function toggleClaimFlag(claimId: number, field: "paid" | "transferred") {
  await requireAdmin();
  const claim = await db.query.claims.findFirst({ where: eq(claims.id, claimId) });
  if (!claim) return;
  await db.update(claims).set({ [field]: !claim[field] }).where(eq(claims.id, claimId));
  revalidateAll();
}

// ---------- admin: friends ----------

export async function addFriend(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const token = randomBytes(12).toString("base64url");
  await db.insert(friends).values({ name, token });
  revalidateAll();
}

export async function removeFriend(friendId: number) {
  await requireAdmin();
  await db.delete(friends).where(eq(friends.id, friendId));
  revalidateAll();
}
