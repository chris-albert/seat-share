import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SubmitButton } from "@/components/submit-button";
import { addFriend, recordPayment, removeFriend, removePayment } from "@/lib/actions";
import { isAdmin } from "@/lib/auth";
import { formatDateParts, formatPrice, isPast } from "@/lib/format";
import { friendLedgers, type FriendLedger } from "@/lib/queries";

async function baseUrl(): Promise<string> {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${h.get("host")}`;
}

const paymentDateFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Los_Angeles",
  month: "short",
  day: "numeric",
  year: "numeric",
});

/** paidAt is SQLite's `datetime('now')`: "YYYY-MM-DD HH:MM:SS" in UTC. */
function formatPaymentDate(paidAt: string): string {
  return paymentDateFmt.format(new Date(paidAt.replace(" ", "T") + "Z"));
}

export default async function FriendsPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const [ledgers, base] = await Promise.all([friendLedgers(), baseUrl()]);

  return (
    <>
      <form action={addFriend} className="mb-6 flex gap-2">
        <input name="name" placeholder="Friend's name" required className="input flex-1" />
        <SubmitButton className="btn-primary">Add</SubmitButton>
      </form>

      {ledgers.length === 0 ? (
        <p className="card p-6 text-center text-muted">
          No friends yet. Add one and text them their link.
        </p>
      ) : (
        <ul className="card divide-y divide-line">
          {ledgers.map((ledger) => (
            <li key={ledger.friend.id} className="px-4 py-3">
              <FriendItem ledger={ledger} base={base} />
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-sm text-muted">
        Text each person their link once. Removing a friend also releases any games they claimed
        and deletes their payment history.
      </p>
    </>
  );
}

function Balance({ owed, charged }: { owed: number; charged: number }) {
  if (owed > 0) return <span className="pill bg-warn-bg text-warn">owes ${owed}</span>;
  if (owed < 0) return <span className="pill bg-ok-bg text-ok">${-owed} credit</span>;
  if (charged > 0) return <span className="pill bg-ok-bg text-ok">settled up</span>;
  return null;
}

function FriendItem({ ledger, base }: { ledger: FriendLedger; base: string }) {
  const { friend, claimed, payments, charged, paid, owed } = ledger;
  const link = `${base}/f/${friend.token}`;

  return (
    <>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex w-52 shrink-0 items-center gap-2">
          <span className="font-medium">{friend.name}</span>
          <Balance owed={owed} charged={charged} />
        </div>
        <a
          href={link}
          className="min-w-0 flex-1 truncate font-mono text-sm text-accent hover:underline"
          target="_blank"
        >
          {link}
        </a>
        <form action={removeFriend.bind(null, friend.id)}>
          <SubmitButton className="text-sm text-muted transition-colors hover:text-danger">
            remove
          </SubmitButton>
        </form>
      </div>

      <details className="mt-1">
        <summary className="cursor-pointer text-sm text-muted hover:text-fg">
          {claimed.length} {claimed.length === 1 ? "game" : "games"} · ${charged} charged · $
          {paid} paid
        </summary>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <section>
            <h3 className="section-title">Claimed games</h3>
            {claimed.length === 0 ? (
              <p className="text-sm text-muted">Nothing claimed yet.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {claimed.map(({ game }) => {
                  const { month, day } = formatDateParts(game);
                  return (
                    <li key={game.id} className="flex items-baseline justify-between gap-2">
                      <span className={isPast(game) ? "text-muted" : ""}>
                        {month} {day} vs {game.opponentClub ?? game.opponent}
                      </span>
                      <span className="tabular-nums">{formatPrice(game.price)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section>
            <h3 className="section-title">Payments</h3>
            {payments.length === 0 ? (
              <p className="text-sm text-muted">No payments recorded.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {payments.map((p) => (
                  <li key={p.id} className="flex items-baseline gap-2">
                    <span className="text-muted">{formatPaymentDate(p.paidAt)}</span>
                    <span className="flex-1 text-right tabular-nums">${p.amount}</span>
                    <form action={removePayment.bind(null, p.id)}>
                      <SubmitButton className="text-xs text-muted transition-colors hover:text-danger">
                        remove
                      </SubmitButton>
                    </form>
                  </li>
                ))}
              </ul>
            )}
            <form
              action={recordPayment.bind(null, friend.id)}
              className="mt-2 flex items-center gap-1.5 text-sm"
            >
              <span className="text-muted">$</span>
              <input
                name="amount"
                type="number"
                min={1}
                step={1}
                required
                placeholder={owed > 0 ? String(owed) : "0"}
                className="input w-20 px-2 py-0.5 text-sm"
              />
              <SubmitButton className="btn-secondary px-2.5 py-0.5 text-xs">
                Record payment
              </SubmitButton>
            </form>
          </section>
        </div>
      </details>
    </>
  );
}
