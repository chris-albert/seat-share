import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { claimGame, releaseGame } from "@/lib/actions";
import { formatDay, formatPrice, groupByMonth } from "@/lib/format";
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
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Hey {friend.name} ⚾</h1>
        <p className="text-zinc-600 mt-1">
          Chris&apos;s Giants seats. Tap a game to claim it. First come, first served.
          Bookmark this page — it&apos;s your personal link.
        </p>
      </header>

      {banner && (
        <div
          className={`mb-6 rounded-lg px-4 py-3 text-sm ${
            banner.tone === "ok"
              ? "bg-emerald-50 text-emerald-800"
              : "bg-amber-50 text-amber-800"
          }`}
        >
          {banner.text}
        </div>
      )}

      {mine.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500 mb-2">
            Your games
          </h2>
          <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white">
            {mine.map((row) => (
              <GameItem key={row.game.id} row={row} token={token} friendId={friend.id} />
            ))}
          </ul>
        </section>
      )}

      {rows.length === 0 ? (
        <p className="text-zinc-600">Nothing posted yet. Check back later.</p>
      ) : (
        groupByMonth(rows).map(([month, monthRows]) => (
          <section key={month} className="mb-8">
            <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500 mb-2">
              {month}
            </h2>
            <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white">
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
    status = <span className="text-zinc-400">Chris is going</span>;
  } else if (isMine) {
    status = <span className="font-medium text-emerald-700">Yours</span>;
  } else if (claim) {
    status = <span className="text-zinc-500">{claim.friend.name} has it</span>;
  } else {
    status = <span className="font-medium text-zinc-900">{formatPrice(game.price)}</span>;
  }

  return (
    <li
      id={`game-${game.id}`}
      className={`flex items-center gap-3 px-4 py-3 ${isAvailable || isMine ? "" : "opacity-60"}`}
    >
      <div className="w-24 shrink-0 text-sm">
        <div className="font-medium">{formatDay(game)}</div>
        <div className="text-zinc-500">{game.time}</div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="truncate">vs {game.opponent}</div>
        <div className="text-sm">{status}</div>
      </div>
      {isAvailable && (
        <form action={claimGame.bind(null, token, game.id)}>
          <button className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700">
            I&apos;ll take it
          </button>
        </form>
      )}
      {isMine && (
        <form action={releaseGame.bind(null, token, game.id)}>
          <button className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100">
            Release
          </button>
        </form>
      )}
    </li>
  );
}
