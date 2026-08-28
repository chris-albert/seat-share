import type { Game } from "@/lib/db/schema";
import { formatDateParts } from "@/lib/format";

export function DateTile({ game }: { game: Game }) {
  const { weekday, month, day } = formatDateParts(game);
  return (
    <div className="flex w-14 shrink-0 flex-col items-center rounded-xl border border-line bg-raised py-1.5 leading-none">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">{weekday}</span>
      <span className="mt-1 text-xl font-semibold tabular-nums">{day}</span>
      <span className="mt-0.5 text-[10px] font-medium uppercase text-muted">{month}</span>
    </div>
  );
}
