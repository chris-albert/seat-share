import type { Game } from "./db/schema";

const dayFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Los_Angeles",
  weekday: "short",
  month: "short",
  day: "numeric",
});

const monthFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Los_Angeles",
  month: "long",
  year: "numeric",
});

/** "Sat, Jul 12" */
export function formatDay(game: Game): string {
  return dayFmt.format(new Date(game.startsAt));
}

/** "July 2026" */
export function formatMonth(game: Game): string {
  return monthFmt.format(new Date(game.startsAt));
}

export function formatPrice(price: number | null): string {
  return price == null ? "Free / ask" : `$${price}`;
}

export function isPast(game: Game): boolean {
  return new Date(game.startsAt).getTime() < Date.now();
}

/** Group games by month, preserving order. */
export function groupByMonth<T extends { game: Game }>(rows: T[]): [string, T[]][] {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const key = formatMonth(row.game);
    map.set(key, [...(map.get(key) ?? []), row]);
  }
  return [...map.entries()];
}
