import { redirect } from "next/navigation";
import { login } from "@/lib/actions";
import { isAdmin } from "@/lib/auth";

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  if (await isAdmin()) redirect("/admin");
  const { error } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <form action={login} className="w-full max-w-xs space-y-3">
        <h1 className="text-xl font-semibold">Admin</h1>
        {error && <p className="text-sm text-red-600">Wrong password.</p>}
        <input
          type="password"
          name="password"
          placeholder="Password"
          autoFocus
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2"
        />
        <button className="w-full rounded-lg bg-zinc-900 px-3 py-2 font-medium text-white">
          Sign in
        </button>
      </form>
    </main>
  );
}
