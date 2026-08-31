import { redirect } from "next/navigation";
import { DateTile } from "@/components/date-tile";
import { GameCalendar, type CellTone } from "@/components/game-calendar";
import { GameTags, GameTime } from "@/components/game-tags";
import { SubmitButton } from "@/components/submit-button";
import { TeamLogo } from "@/components/team-logo";
import { ViewToggle } from "@/components/view-toggle";
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
          <SubmitButton className="btn-primary w-full sm:w-auto">
            Offer all {counts.hidden} hidden games
          </SubmitButton>
        </form>
      )}

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Upcoming games</h2>
        <ViewToggle />
      </div>

      <div className="cal:hidden">
        {groupByMonth(upcoming).map(([month, monthRows]) => (
          <section key={month} className="mb-8">
            <h2 className="section-title">{month}</h2>
            <ul className="card @container divide-y divide-line">
              {monthRows.map((row) => (
                <li key={row.game.id}>
                  <AdminGameItem row={row} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="hidden cal:block">
        <GameCalendar rows={upcoming} cell={cellFor} detail={(row) => <AdminGameItem row={row} />} />
      </div>

      {past.length > 0 && (
        <details className="mt-8">
          <summary className="cursor-pointer text-sm text-muted hover:text-fg">
            {past.length} past games
          </summary>
          <ul className="card @container mt-3 divide-y divide-line opacity-60">
            {past.map((row) => (
              <li key={row.game.id}>
                <AdminGameItem row={row} />
              </li>
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

function cellFor(row: GameRow): { tone: CellTone; label: string } {
  const { game, claim } = row;
  if (claim) return { tone: "ok", label: claim.friend.name.split(" ")[0] };
  if (game.status === "hidden") return { tone: "hidden", label: "Hidden" };
  if (game.status === "keeping") return { tone: "solid", label: "Keeping" };
  return { tone: "accent", label: game.price == null ? "Free" : `$${game.price}` };
}

function Opponent({ game }: { game: GameRow["game"] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
      <TeamLogo game={game} className="h-6 w-6 shrink-0" />
      <span className="font-medium">vs {game.opponentClub ?? game.opponent}</span>
      <GameTime game={game} />
    </div>
  );
}

/**
 * One game's controls. Responsive via container queries (`@md:`) rather than the
 * viewport so the same markup stacks inside the narrow calendar popover.
 */
function AdminGameItem({ row }: { row: GameRow }) {
  const { game, claim } = row;
  return (
    <div className="flex flex-col gap-3 px-4 py-3 @md:flex-row @md:items-center @md:gap-4">
      <div className="flex items-center gap-3 pr-8 @md:pr-0">
        <DateTile game={game} />
        <div className="min-w-0 @md:hidden">
          <Opponent game={game} />
          <GameTags game={game} className="mt-1" />
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="hidden @md:block">
          <Opponent game={game} />
          <GameTags game={game} className="mt-1" />
        </div>
        {claim ? (
          <div className="flex flex-wrap items-center gap-2 text-sm @md:mt-1.5">
            <span className="pill bg-ok-bg text-ok">{claim.friend.name}</span>
            <Toggle claimId={claim.id} field="paid" on={claim.paid} />
            <Toggle claimId={claim.id} field="transferred" on={claim.transferred} />
            <form action={unclaimGame.bind(null, game.id)}>
              <SubmitButton className="text-xs text-muted transition-colors hover:text-danger">
                unclaim
              </SubmitButton>
            </form>
          </div>
        ) : (
          <form
            action={setGamePrice.bind(null, game.id)}
            className="flex items-center gap-1.5 text-sm @md:mt-1.5"
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
            <SubmitButton className="btn-secondary px-2.5 py-0.5 text-xs">Save</SubmitButton>
          </form>
        )}
      </div>

      <div className="inline-flex shrink-0 self-start rounded-lg border border-line bg-raised p-0.5 @md:self-center">
        {GAME_STATUSES.map((s) => {
          const active = game.status === s;
          return (
            <form key={s} action={setGameStatus.bind(null, game.id, s)}>
              <SubmitButton
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
              </SubmitButton>
            </form>
          );
        })}
      </div>
    </div>
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
      <SubmitButton
        className={`pill transition-colors ${
          on ? "bg-ok-bg text-ok" : "bg-raised text-muted line-through hover:text-fg"
        }`}
      >
        {field}
      </SubmitButton>
    </form>
  );
}
