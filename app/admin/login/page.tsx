import { redirect } from "next/navigation";
import { login } from "@/lib/actions";
import { isAdmin } from "@/lib/auth";

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  if (await isAdmin()) redirect("/admin");
  const { error } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <form action={login} className="card w-full max-w-xs space-y-4 p-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Admin</h1>
          <p className="mt-1 text-sm text-muted">Sign in to manage games and friends.</p>
        </div>
        {error && (
          <p className="rounded-lg bg-warn-bg px-3 py-2 text-sm text-warn">Wrong password.</p>
        )}
        <input
          type="password"
          name="password"
          placeholder="Password"
          autoFocus
          className="input w-full"
        />
        <button className="btn-primary w-full">Sign in</button>
      </form>
    </main>
  );
}
