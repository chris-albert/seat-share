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
        <input
          name="name"
          placeholder="Friend's name"
          required
          className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2"
        />
        <button className="rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white">
          Add
        </button>
      </form>

      {list.length === 0 ? (
        <p className="text-zinc-600">No friends yet. Add one and text them their link.</p>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white">
          {list.map((f) => {
            const link = `${base}/f/${f.token}`;
            return (
              <li key={f.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="w-32 shrink-0 font-medium">{f.name}</div>
                <a
                  href={link}
                  className="min-w-0 flex-1 truncate font-mono text-sm text-blue-700"
                  target="_blank"
                >
                  {link}
                </a>
                <form action={removeFriend.bind(null, f.id)}>
                  <button className="text-sm text-zinc-400 hover:text-red-600">remove</button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-4 text-sm text-zinc-500">
        Text each person their link once. Removing a friend also releases any games they claimed.
      </p>
    </>
  );
}
