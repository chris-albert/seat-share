import type { Game } from "@/lib/db/schema";
import { gameTags } from "@/lib/format";

export function GameTags({ game, className = "" }: { game: Game; className?: string }) {
  const tags = gameTags(game);
  if (tags.length === 0) return null;
  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {tags.map((t) => (
        <span
          key={t.label}
          className={`pill ${t.tone === "accent" ? "bg-accent-soft text-accent" : "bg-raised text-muted"}`}
        >
          {t.label}
        </span>
      ))}
    </div>
  );
}

/** "7:15 PM" with a sun or moon for day/night games. */
export function GameTime({ game }: { game: Game }) {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap text-muted">
      {game.dayNight === "day" ? (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-warn" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-label="Day game">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : game.dayNight === "night" ? (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-label="Night game">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : null}
      {game.time}
    </span>
  );
}
