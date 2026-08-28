import type { ReactNode } from "react";
import { calendarMonths, todayLocal, type CalendarMonth } from "@/lib/format";
import type { GameRow } from "@/lib/queries";
import { TeamLogo } from "./team-logo";

export type CellTone = "accent" | "ok" | "solid" | "muted" | "hidden";

const TONE: Record<CellTone, { cell: string; label: string }> = {
  accent: { cell: "border-accent/50 bg-accent-soft hover:border-accent", label: "text-accent" },
  ok: { cell: "border-ok/40 bg-ok-bg hover:border-ok", label: "text-ok" },
  solid: { cell: "border-line bg-raised hover:border-muted", label: "text-fg" },
  muted: { cell: "border-line bg-surface opacity-50 hover:opacity-80", label: "text-muted" },
  hidden: { cell: "border-dashed border-line bg-transparent opacity-60 hover:opacity-100", label: "text-muted" },
};

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

/**
 * Month grids of games. Each game is a button that opens a native popover with
 * `detail(row)` inside — so the same server-rendered forms work in both views.
 */
export function GameCalendar({
  rows,
  cell,
  detail,
}: {
  rows: GameRow[];
  cell: (row: GameRow) => { tone: CellTone; label: string };
  detail: (row: GameRow) => ReactNode;
}) {
  const today = todayLocal();
  return (
    <>
      {calendarMonths(rows).map((month) => (
        <section key={month.key} className="mb-8">
          <h2 className="section-title">{month.label}</h2>
          <div className="card p-2 sm:p-3">
            <div className="mb-1 grid grid-cols-7 text-center text-[10px] font-semibold uppercase tracking-wider text-muted">
              {WEEKDAYS.map((d, i) => (
                <div key={i} className="py-1">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {visibleWeeks(month, today).map((week, w) =>
                week.map((day, d) => {
                  if (day === null) return <div key={`${w}-${d}`} />;
                  const date = `${month.key}-${String(day).padStart(2, "0")}`;
                  const games = month.byDay.get(day) ?? [];
                  const isToday = date === today;
                  if (games.length === 0) {
                    return (
                      <div key={day} className="px-1 pt-0.5 text-xs tabular-nums text-muted/60">
                        <DayNumber day={day} today={isToday} />
                      </div>
                    );
                  }
                  return (
                    <div key={day} className="flex min-h-14 flex-col gap-1 sm:min-h-20">
                      {games.map((row) => {
                        const { tone, label } = cell(row);
                        const id = `game-pop-${row.game.id}`;
                        return (
                          <div key={row.game.id} className="contents">
                            <button
                              type="button"
                              popoverTarget={id}
                              className={`flex flex-1 flex-col items-center rounded-lg border px-0.5 pt-0.5 pb-1 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent ${TONE[tone].cell}`}
                            >
                              <span className="self-start px-0.5 text-xs tabular-nums text-muted">
                                <DayNumber day={day} today={isToday} />
                              </span>
                              <TeamLogo game={row.game} className="h-5 w-5 sm:h-7 sm:w-7" />
                              <span
                                className={`mt-0.5 w-full truncate text-[10px] font-semibold leading-tight sm:text-xs ${TONE[tone].label}`}
                              >
                                {label}
                              </span>
                            </button>
                            <div id={id} popover="auto" className="card p-4 sm:p-5">
                              <button
                                type="button"
                                popoverTarget={id}
                                popoverTargetAction="hide"
                                aria-label="Close"
                                className="btn-ghost absolute top-2 right-2 h-8 w-8 rounded-full p-0"
                              >
                                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                  <path d="M6 6l12 12M18 6L6 18" />
                                </svg>
                              </button>
                              {detail(row)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                }),
              )}
            </div>
          </div>
        </section>
      ))}
    </>
  );
}

/**
 * The month as rows of 7 (null = padding), minus any leading weeks that are entirely
 * in the past with nothing in them — so the current month doesn't open on empty space.
 */
function visibleWeeks<T>(month: CalendarMonth<T>, today: string): (number | null)[][] {
  const cells: (number | null)[] = [
    ...Array<null>(month.leadingBlanks).fill(null),
    ...Array.from({ length: month.daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));
  const isStale = (week: (number | null)[]) =>
    week.every((day) => {
      if (day === null) return true;
      const date = `${month.key}-${String(day).padStart(2, "0")}`;
      return date < today && !month.byDay.has(day);
    });
  while (weeks.length > 1 && isStale(weeks[0])) weeks.shift();
  return weeks;
}

function DayNumber({ day, today }: { day: number; today: boolean }) {
  if (!today) return <>{day}</>;
  return (
    <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 font-semibold text-accent-fg">
      {day}
    </span>
  );
}
