import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DateTile } from "@/components/date-tile";
import { claimGame, releaseGame } from "@/lib/actions";
import { formatPrice, groupByMonth } from "@/lib/format";
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
              <GameItem key={row.game.id} row={row} token={token} friendId={friend.id} />
            ))}
          </ul>
        </section>
      )}

      {rows.length === 0 ? (
        <p className="card p-6 text-center text-muted">Nothing posted yet. Check back later.</p>
      ) : (
        groupByMonth(rows).map(([month, monthRows]) => (
          <section key={month} className="mb-8">
            <h2 className="section-title">{month}</h2>
            <ul className="card divide-y divide-line">
              {monthRows.map((row) => (
                <GameItem key={row.game.id} row={row} token={token} friendId={friend.id} />
              ))}
            </ul>
          </section>
        ))
      )}
    </main>
  );
}

function GameItem({ row, token, friendId }: { row: GameRow; token: string; friendId: number }) {
  const { game, claim } = row;
  const isMine = claim?.friendId === friendId;
  const isAvailable = game.status === "available" && !claim;

  let status: React.ReactNode;
  if (game.status === "keeping") {
    status = <span className="text-muted">Chris is going</span>;
  } else if (isMine) {
    status = <span className="pill bg-ok-bg text-ok">Yours</span>;
  } else if (claim) {
    status = <span className="text-muted">{claim.friend.name} has it</span>;
  } else {
    status = <span className="font-semibold text-accent">{formatPrice(game.price)}</span>;
  }

  return (
    <li
      id={`game-${game.id}`}
      className={`flex items-center gap-3 px-4 py-3 ${isAvailable || isMine ? "" : "opacity-50"}`}
    >
      <DateTile game={game} />
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">vs {game.opponent}</div>
        <div className="mt-0.5 flex items-center gap-2 text-sm">
          <span className="text-muted">{game.time}</span>
          <span className="text-line">·</span>
          {status}
        </div>
      </div>
      {isAvailable && (
        <form action={claimGame.bind(null, token, game.id)}>
          <button className="btn-primary">I&apos;ll take it</button>
        </form>
      )}
      {isMine && (
        <form action={releaseGame.bind(null, token, game.id)}>
          <button className="btn-secondary">Release</button>
        </form>
      )}
    </li>
  );
}
