import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DateTile } from "@/components/date-tile";
import { GameCalendar, type CellTone } from "@/components/game-calendar";
import { GameTags, GameTime } from "@/components/game-tags";
import { TeamLogo } from "@/components/team-logo";
import { ViewToggle } from "@/components/view-toggle";
import { claimGame, releaseGame } from "@/lib/actions";
import { formatDateParts, formatPrice, groupByMonth, relativeDay } from "@/lib/format";
import { friendByToken, upcomingVisibleGames, type GameRow } from "@/lib/queries";

export const metadata: Metadata = { title: "Giants tickets · Seat Share" };

const MESSAGES: Record<string, { text: string; tone: "ok" | "warn" }> = {
  claimed: { text: "It's yours! Chris will transfer the tickets in the Ballpark app.", tone: "ok" },
  released: { text: "Released. It's back up for grabs.", tone: "ok" },
  taken: { text: "Someone grabbed that one just before you.", tone: "warn" },
  unavailable: { text: "That game isn't available anymore.", tone: "warn" },
};

export default async function FriendPage({
  params,
  searchParams,
}: PageProps<"/f/[token]">) {
  const { token } = await params;
  const { msg } = await searchParams;
  const friend = await friendByToken(token);
  if (!friend) notFound();

  const rows = await upcomingVisibleGames();
  const mine = rows.filter((r) => r.claim?.friendId === friend.id);
  const banner = typeof msg === "string" ? MESSAGES[msg] : undefined;

  return (
    <main className="mx-auto w-full max-w-2xl p-4 sm:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Hey {friend.name} ⚾</h1>
        <p className="mt-2 text-muted">
          Chris&apos;s Giants seats. Tap a game to claim it — first come, first served.
          Bookmark this page; it&apos;s your personal link.
        </p>
      </header>

      {banner && (
        <div
          className={`mb-8 flex items-start gap-3 rounded-xl px-4 py-3 text-sm ${
            banner.tone === "ok" ? "bg-ok-bg text-ok" : "bg-warn-bg text-warn"
          }`}
        >
          <span className="mt-0.5 text-base leading-none">{banner.tone === "ok" ? "✓" : "!"}</span>
          {banner.text}
        </div>
      )}

      {mine.length > 0 && (
        <section className="mb-8">
          <h2 className="section-title">Your games</h2>
          <ul className="card divide-y divide-line">
            {mine.map((row) => (
              <li key={row.game.id}>
                <GameItem row={row} token={token} friendId={friend.id} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {rows.length === 0 ? (
        <p className="card p-6 text-center text-muted">Nothing posted yet. Check back later.</p>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Upcoming games</h2>
            <ViewToggle />
          </div>

          <div className="cal:hidden">
            {groupByMonth(rows).map(([month, monthRows]) => (
              <section key={month} className="mb-8">
                <h2 className="section-title">{month}</h2>
                <ul className="card divide-y divide-line">
                  {monthRows.map((row) => (
                    <li key={row.game.id} id={`game-${row.game.id}`}>
                      <GameItem row={row} token={token} friendId={friend.id} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <div className="hidden cal:block">
            <GameCalendar
              rows={rows}
              cell={(row) => cellFor(row, friend.id)}
              detail={(row) => <GameDetail row={row} token={token} friendId={friend.id} />}
            />
          </div>
        </>
      )}
    </main>
  );
}

function cellFor(row: GameRow, friendId: number): { tone: CellTone; label: string } {
  const { game, claim } = row;
  if (claim?.friendId === friendId) return { tone: "ok", label: "Yours" };
  if (claim) return { tone: "muted", label: claim.friend.name.split(" ")[0] };
  if (game.status === "keeping") return { tone: "muted", label: "Chris" };
  return { tone: "accent", label: game.price == null ? "Free" : `$${game.price}` };
}

function GameStatus({ row, friendId }: { row: GameRow; friendId: number }) {
  const { game, claim } = row;
  if (game.status === "keeping") return <span className="text-muted">Chris is going</span>;
  if (claim?.friendId === friendId) return <span className="pill bg-ok-bg text-ok">Yours</span>;
  if (claim) return <span className="text-muted">{claim.friend.name} has it</span>;
  return <span className="font-semibold whitespace-nowrap text-accent">{formatPrice(game.price)}</span>;
}

function GameActions({ row, token, friendId }: { row: GameRow; token: string; friendId: number }) {
  const { game, claim } = row;
  if (game.status === "available" && !claim) {
    return (
      <form action={claimGame.bind(null, token, game.id)}>
        <button className="btn-primary">I&apos;ll take it</button>
      </form>
    );
  }
  if (claim?.friendId === friendId) {
    return (
      <form action={releaseGame.bind(null, token, game.id)}>
        <button className="btn-secondary">Release</button>
      </form>
    );
  }
  return null;
}

/** One row in the list view. */
function GameItem({ row, token, friendId }: { row: GameRow; token: string; friendId: number }) {
  const { game, claim } = row;
  const active = (game.status === "available" && !claim) || claim?.friendId === friendId;

  return (
    <div className={`flex items-center gap-3 px-4 py-3 ${active ? "" : "opacity-50"}`}>
      <DateTile game={game} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <TeamLogo game={game} className="h-6 w-6 shrink-0" />
          <span className="truncate font-medium">vs {game.opponentClub ?? game.opponent}</span>
          {game.opponentAbbrev && (
            <span className="hidden text-xs font-semibold tracking-wider text-muted sm:inline">
              {game.opponentAbbrev}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-sm">
          <GameTime game={game} />
          <span className="text-line">·</span>
          <GameStatus row={row} friendId={friendId} />
        </div>
        <GameTags game={game} className="mt-1.5" />
      </div>
      <GameActions row={row} token={token} friendId={friendId} />
    </div>
  );
}

/** The card behind a calendar cell. */
function GameDetail({ row, token, friendId }: { row: GameRow; token: string; friendId: number }) {
  const { game } = row;
  const { weekday, month, day } = formatDateParts(game);
  return (
    <>
      <div className="flex items-center gap-4 pr-8">
        <TeamLogo game={game} variant="primary" className="h-16 w-16 shrink-0" />
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted">
            {weekday}, {month} {day} · {relativeDay(game)}
          </div>
          <div className="mt-0.5 text-xl font-semibold tracking-tight">
            Giants vs {game.opponentClub ?? game.opponent}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-sm">
            <GameTime game={game} />
            <span className="text-line">·</span>
            <span className="text-muted">Oracle Park</span>
          </div>
        </div>
      </div>
      <GameTags game={game} className="mt-3" />
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
        <GameStatus row={row} friendId={friendId} />
        <GameActions row={row} token={token} friendId={friendId} />
      </div>
    </>
  );
}
