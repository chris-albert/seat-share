import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { addFriend, removeFriend } from "@/lib/actions";
import { isAdmin } from "@/lib/auth";
import { allFriends } from "@/lib/queries";

async function baseUrl(): Promise<string> {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${h.get("host")}`;
}

export default async function FriendsPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const [list, base] = await Promise.all([allFriends(), baseUrl()]);

  return (
    <>
      <form action={addFriend} className="mb-6 flex gap-2">
        <input name="name" placeholder="Friend's name" required className="input flex-1" />
        <button className="btn-primary">Add</button>
      </form>

      {list.length === 0 ? (
        <p className="card p-6 text-center text-muted">
          No friends yet. Add one and text them their link.
        </p>
      ) : (
        <ul className="card divide-y divide-line">
          {list.map((f) => {
            const link = `${base}/f/${f.token}`;
            return (
              <li
                key={f.id}
                className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:gap-4"
              >
                <div className="w-32 shrink-0 font-medium">{f.name}</div>
                <a
                  href={link}
                  className="min-w-0 flex-1 truncate font-mono text-sm text-accent hover:underline"
                  target="_blank"
                >
                  {link}
                </a>
                <form action={removeFriend.bind(null, f.id)}>
                  <button className="text-sm text-muted transition-colors hover:text-danger">
                    remove
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-4 text-sm text-muted">
        Text each person their link once. Removing a friend also releases any games they claimed.
      </p>
    </>
  );
}
