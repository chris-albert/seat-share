import { redirect } from "next/navigation";
import { DateTile } from "@/components/date-tile";
import {
  offerAllHiddenUpcoming,
  setGamePrice,
  setGameStatus,
  toggleClaimFlag,
  unclaimGame,
} from "@/lib/actions";
import { isAdmin } from "@/lib/auth";
import { GAME_STATUSES, type GameStatus } from "@/lib/db";
import { groupByMonth, isPast } from "@/lib/format";
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
      <p className="card p-6 text-center text-muted">
        No games yet. Run <code className="rounded bg-raised px-1.5 py-0.5 text-fg">npm run seed</code>{" "}
        to import the schedule.
      </p>
    );
  }

  return (
    <>
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Keeping" value={counts.keeping} />
        <Stat label="Up for grabs" value={counts.available} accent />
        <Stat label="Claimed" value={counts.claimed} />
        <Stat label="Hidden" value={counts.hidden} />
      </div>

      {counts.hidden > 0 && (
        <form action={offerAllHiddenUpcoming} className="mb-8">
          <button className="btn-primary w-full sm:w-auto">
            Offer all {counts.hidden} hidden games
          </button>
        </form>
      )}

      {groupByMonth(upcoming).map(([month, monthRows]) => (
        <section key={month} className="mb-8">
          <h2 className="section-title">{month}</h2>
          <ul className="card divide-y divide-line">
            {monthRows.map((row) => (
              <AdminGameItem key={row.game.id} row={row} />
            ))}
          </ul>
        </section>
      ))}

      {past.length > 0 && (
        <details className="mt-8">
          <summary className="cursor-pointer text-sm text-muted hover:text-fg">
            {past.length} past games
          </summary>
          <ul className="card mt-3 divide-y divide-line opacity-60">
            {past.map((row) => (
              <AdminGameItem key={row.game.id} row={row} />
            ))}
          </ul>
        </details>
      )}
    </>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="card px-4 py-3">
      <div className="text-xs font-medium uppercase tracking-wider text-muted">{label}</div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${accent ? "text-accent" : ""}`}>
        {value}
      </div>
    </div>
  );
}

function AdminGameItem({ row }: { row: GameRow }) {
  const { game, claim } = row;
  return (
    <li className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex items-center gap-3">
        <DateTile game={game} />
        <div className="min-w-0 sm:hidden">
          <div className="truncate font-medium">vs {game.opponent}</div>
          <div className="text-sm text-muted">{game.time}</div>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="hidden sm:block">
          <span className="font-medium">vs {game.opponent}</span>
          <span className="ml-2 text-sm text-muted">{game.time}</span>
        </div>
        {claim ? (
          <div className="flex flex-wrap items-center gap-2 text-sm sm:mt-1">
            <span className="pill bg-ok-bg text-ok">{claim.friend.name}</span>
            <Toggle claimId={claim.id} field="paid" on={claim.paid} />
            <Toggle claimId={claim.id} field="transferred" on={claim.transferred} />
            <form action={unclaimGame.bind(null, game.id)}>
              <button className="text-xs text-muted transition-colors hover:text-danger">
                unclaim
              </button>
            </form>
          </div>
        ) : (
          <form
            action={setGamePrice.bind(null, game.id)}
            className="flex items-center gap-1.5 text-sm sm:mt-1"
          >
            <span className="text-muted">$</span>
            <input
              name="price"
              type="number"
              min={0}
              step={1}
              defaultValue={game.price ?? ""}
              placeholder="free"
              className="input w-20 px-2 py-0.5 text-sm"
            />
            <button className="text-muted transition-colors hover:text-fg">save</button>
          </form>
        )}
      </div>

      <div className="inline-flex shrink-0 self-start rounded-lg border border-line bg-raised p-0.5 sm:self-center">
        {GAME_STATUSES.map((s) => {
          const active = game.status === s;
          return (
            <form key={s} action={setGameStatus.bind(null, game.id, s)}>
              <button
                disabled={active}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  active
                    ? s === "available"
                      ? "bg-accent text-accent-fg shadow-sm"
                      : "bg-surface text-fg shadow-sm"
                    : "text-muted hover:text-fg"
                }`}
              >
                {STATUS_LABEL[s]}
              </button>
            </form>
          );
        })}
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
        className={`pill transition-colors ${
          on ? "bg-ok-bg text-ok" : "bg-raised text-muted line-through hover:text-fg"
        }`}
      >
        {field}
      </button>
    </form>
  );
}
