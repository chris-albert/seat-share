import { redirect } from "next/navigation";
import {
  offerAllHiddenUpcoming,
  setGamePrice,
  setGameStatus,
  toggleClaimFlag,
  unclaimGame,
} from "@/lib/actions";
import { isAdmin } from "@/lib/auth";
import { GAME_STATUSES, type GameStatus } from "@/lib/db";
import { formatDay, groupByMonth, isPast } from "@/lib/format";
import { allGames, type GameRow } from "@/lib/queries";

const STATUS_LABEL: Record<GameStatus, string> = {
  hidden: "Hidden",
  available: "Offered",
  keeping: "Keeping",
};

export default async function AdminGamesPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const rows = await allGames();
  const upcoming = rows.filter((r) => !isPast(r.game));
  const past = rows.filter((r) => isPast(r.game));

  const counts = {
    hidden: upcoming.filter((r) => r.game.status === "hidden").length,
    available: upcoming.filter((r) => r.game.status === "available" && !r.claim).length,
    claimed: upcoming.filter((r) => r.claim).length,
    keeping: upcoming.filter((r) => r.game.status === "keeping").length,
  };

  if (rows.length === 0) {
    return (
      <p className="text-zinc-600">
        No games yet. Run <code className="rounded bg-zinc-200 px-1">npm run seed</code> to
        import the schedule.
      </p>
    );
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-600">
        <span>{counts.keeping} keeping</span>
        <span>{counts.available} up for grabs</span>
        <span>{counts.claimed} claimed</span>
        <span>{counts.hidden} hidden</span>
        {counts.hidden > 0 && (
          <form action={offerAllHiddenUpcoming} className="ml-auto">
            <button className="rounded-lg bg-zinc-900 px-3 py-1.5 font-medium text-white">
              Offer all {counts.hidden} hidden games
            </button>
          </form>
        )}
      </div>

      {groupByMonth(upcoming).map(([month, monthRows]) => (
        <section key={month} className="mb-8">
          <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-zinc-500">
            {month}
          </h2>
          <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white">
            {monthRows.map((row) => (
              <AdminGameItem key={row.game.id} row={row} />
            ))}
          </ul>
        </section>
      ))}

      {past.length > 0 && (
        <details className="mt-8">
          <summary className="cursor-pointer text-sm text-zinc-500">
            {past.length} past games
          </summary>
          <ul className="mt-2 divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white opacity-70">
            {past.map((row) => (
              <AdminGameItem key={row.game.id} row={row} />
            ))}
          </ul>
        </details>
      )}
    </>
  );
}

function AdminGameItem({ row }: { row: GameRow }) {
  const { game, claim } = row;
  return (
    <li className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="w-28 shrink-0 text-sm">
        <div className="font-medium">{formatDay(game)}</div>
        <div className="text-zinc-500">{game.time}</div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate">vs {game.opponent}</div>
        {claim ? (
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium text-emerald-700">{claim.friend.name}</span>
            <Toggle claimId={claim.id} field="paid" on={claim.paid} />
            <Toggle claimId={claim.id} field="transferred" on={claim.transferred} />
            <form action={unclaimGame.bind(null, game.id)}>
              <button className="text-zinc-400 hover:text-red-600">unclaim</button>
            </form>
          </div>
        ) : (
          <form action={setGamePrice.bind(null, game.id)} className="mt-1 flex items-center gap-1 text-sm">
            <span className="text-zinc-500">$</span>
            <input
              name="price"
              type="number"
              min={0}
              step={1}
              defaultValue={game.price ?? ""}
              placeholder="free"
              className="w-20 rounded border border-zinc-300 px-2 py-0.5"
            />
            <button className="text-zinc-500 hover:text-zinc-900">save</button>
          </form>
        )}
      </div>

      <div className="flex shrink-0 gap-1">
        {GAME_STATUSES.map((s) => (
          <form key={s} action={setGameStatus.bind(null, game.id, s)}>
            <button
              disabled={game.status === s}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                game.status === s
                  ? "bg-zinc-900 text-white"
                  : "border border-zinc-300 text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              {STATUS_LABEL[s]}
            </button>
          </form>
        ))}
      </div>
    </li>
  );
}

function Toggle({
  claimId,
  field,
  on,
}: {
  claimId: number;
  field: "paid" | "transferred";
  on: boolean;
}) {
  return (
    <form action={toggleClaimFlag.bind(null, claimId, field)}>
      <button
        className={`rounded px-1.5 py-0.5 text-xs ${
          on ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-500 line-through"
        }`}
      >
        {field}
      </button>
    </form>
  );
}
