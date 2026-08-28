import Link from "next/link";
import { redirect } from "next/navigation";
import { logout } from "@/lib/actions";
import { isAdmin } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect("/admin/login");

  return (
    <div className="mx-auto w-full max-w-4xl p-4 sm:p-8">
      <nav className="mb-6 flex items-center gap-4 text-sm">
        <Link href="/admin" className="font-semibold">Games</Link>
        <Link href="/admin/friends" className="font-semibold">Friends</Link>
        <form action={logout} className="ml-auto">
          <button className="text-zinc-500 hover:text-zinc-900">Sign out</button>
        </form>
      </nav>
      {children}
    </div>
  );
}
