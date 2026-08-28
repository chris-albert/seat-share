import type { Game } from "./db/schema";

const partsFmt = new Intl.DateTimeFormat("en-US", {
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

/** { weekday: "Sat", month: "Jul", day: "12" } — for the calendar-tile date block. */
export function formatDateParts(game: Game): { weekday: string; month: string; day: string } {
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    partsFmt.formatToParts(new Date(game.startsAt)).find((p) => p.type === type)?.value ?? "";
  return { weekday: get("weekday"), month: get("month"), day: get("day") };
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
