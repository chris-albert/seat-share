import type { Game } from "@/lib/db/schema";

/**
 * Opponent logo from MLB's public CDN. Cap logos come in on-light / on-dark variants
 * (swapped via CSS like the theme toggle icons); the primary mark is used at large sizes.
 */
export function TeamLogo({
  game,
  variant = "cap",
  className = "h-6 w-6",
}: {
  game: Game;
  variant?: "cap" | "primary";
  className?: string;
}) {
  const id = game.opponentTeamId;
  if (!id) {
    return (
      <span
        className={`${className} inline-flex items-center justify-center rounded-full bg-raised text-[10px] font-semibold text-muted`}
      >
        {game.opponentAbbrev ?? game.opponent.slice(0, 2).toUpperCase()}
      </span>
    );
  }
  const alt = `${game.opponent} logo`;
  /* eslint-disable @next/next/no-img-element -- tiny remote SVGs; next/image adds nothing here */
  if (variant === "primary") {
    return (
      <img src={`https://www.mlbstatic.com/team-logos/${id}.svg`} alt={alt} className={`${className} object-contain`} />
    );
  }
  return (
    <>
      <img
        src={`https://www.mlbstatic.com/team-logos/team-cap-on-light/${id}.svg`}
        alt={alt}
        className={`${className} object-contain dark:hidden`}
      />
      <img
        src={`https://www.mlbstatic.com/team-logos/team-cap-on-dark/${id}.svg`}
        alt={alt}
        className={`${className} hidden object-contain dark:block`}
      />
    </>
  );
  /* eslint-enable @next/next/no-img-element */
}
