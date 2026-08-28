import { Logo } from "@/components/logo";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <div className="max-w-sm text-center">
        <Logo className="mx-auto h-16 w-16 shadow-lg shadow-accent/30 rounded-2xl" />
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">Seat Share</h1>
        <p className="mt-3 text-muted">
          A private page for Giants season tickets. If you got here without a personal link,
          ask Chris for yours.
        </p>
      </div>
    </main>
  );
}
