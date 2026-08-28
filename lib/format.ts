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

const GIANTS_DIVISION = "National League West";

export type Tag = { label: string; tone: "accent" | "muted" };

/** Little facts worth calling out: special games, rivalries, where we are in the series. */
export function gameTags(game: Game): Tag[] {
  const tags: Tag[] = [];
  if (game.description) tags.push({ label: game.description, tone: "accent" });
  if (game.opponentDivision === GIANTS_DIVISION) tags.push({ label: "NL West rival", tone: "accent" });
  else if (game.opponentDivision?.startsWith("American League"))
    tags.push({ label: "Interleague", tone: "muted" });
  if (game.seriesGame && game.seriesLength)
    tags.push({ label: `Game ${game.seriesGame} of ${game.seriesLength}`, tone: "muted" });
  return tags;
}

/** "in 12 days" / "tomorrow" / "today", from the local calendar date. */
export function relativeDay(game: Game): string {
  const days = Math.round((dayNumber(game.date) - dayNumber(todayLocal())) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "tomorrow";
  if (days < 14) return `in ${days} days`;
  return `in ${Math.round(days / 7)} weeks`;
}

function dayNumber(ymd: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

const ymdFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Los_Angeles",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Today's date in the ballpark's timezone, YYYY-MM-DD (same format as game.date). */
export function todayLocal(): string {
  return ymdFmt.format(new Date());
}

export type CalendarMonth<T> = {
  key: string; // "2026-09"
  label: string; // "September 2026"
  /** Empty cells before the 1st (0 = the month starts on a Sunday). */
  leadingBlanks: number;
  daysInMonth: number;
  /** Day of month → games that day (usually one). */
  byDay: Map<number, T[]>;
};

/** Group games by calendar month with the grid math needed to lay out a month view. */
export function calendarMonths<T extends { game: Game }>(rows: T[]): CalendarMonth<T>[] {
  const months = new Map<string, CalendarMonth<T>>();
  for (const row of rows) {
    const key = row.game.date.slice(0, 7);
    let month = months.get(key);
    if (!month) {
      const [y, m] = key.split("-").map(Number);
      const first = new Date(Date.UTC(y, m - 1, 1));
      month = {
        key,
        label: first.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" }),
        leadingBlanks: first.getUTCDay(),
        daysInMonth: new Date(Date.UTC(y, m, 0)).getUTCDate(),
        byDay: new Map(),
      };
      months.set(key, month);
    }
    const day = Number(row.game.date.slice(8, 10));
    month.byDay.set(day, [...(month.byDay.get(day) ?? []), row]);
  }
  return [...months.values()];
}
