/**
 * Imports the SF Giants home schedule from MLB's public Stats API.
 *
 *   npm run seed            # current calendar year
 *   npm run seed -- 2027    # a specific season
 *
 * Safe to re-run: existing games keep their status/price/claims; only
 * schedule details (date/time/opponent/series info) are refreshed.
 */
import { config } from "dotenv";

config({ path: [".env.local", ".env"], quiet: true });

import { db, games } from "../lib/db";

const GIANTS_TEAM_ID = 137;
const season = process.argv[2] ?? String(new Date().getFullYear());

type MlbTeam = {
  id: number;
  name: string;
  abbreviation?: string;
  clubName?: string;
  division?: { name: string };
};

type MlbSchedule = {
  dates: {
    games: {
      gamePk: number;
      gameDate: string; // UTC ISO
      officialDate: string; // YYYY-MM-DD local
      status: { startTimeTBD?: boolean };
      description?: string;
      seriesGameNumber?: number;
      gamesInSeries?: number;
      dayNight?: string;
      teams: {
        home: { team: MlbTeam };
        away: { team: MlbTeam };
      };
    }[];
  }[];
};

const timeFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Los_Angeles",
  hour: "numeric",
  minute: "2-digit",
});

async function main() {
  const url = new URL("https://statsapi.mlb.com/api/v1/schedule");
  url.searchParams.set("sportId", "1");
  url.searchParams.set("teamId", String(GIANTS_TEAM_ID));
  url.searchParams.set("season", season);
  url.searchParams.set("gameType", "R"); // regular season only
  url.searchParams.set("hydrate", "team"); // abbreviation, club name, division

  const res = await fetch(url);
  if (!res.ok) throw new Error(`MLB API ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as MlbSchedule;

  const home = data.dates
    .flatMap((d) => d.games)
    .filter((g) => g.teams.home.team.id === GIANTS_TEAM_ID);

  if (home.length === 0) {
    console.log(`No home games found for ${season}. Schedule not released yet?`);
    return;
  }

  for (const g of home) {
    const away = g.teams.away.team;
    const { mlbGamePk, ...details } = {
      mlbGamePk: g.gamePk,
      date: g.officialDate,
      time: g.status.startTimeTBD ? "TBD" : timeFmt.format(new Date(g.gameDate)),
      startsAt: g.gameDate,
      opponent: away.name,
      opponentTeamId: away.id,
      opponentAbbrev: away.abbreviation ?? null,
      opponentClub: away.clubName ?? null,
      opponentDivision: away.division?.name ?? null,
      seriesGame: g.seriesGameNumber ?? null,
      seriesLength: g.gamesInSeries ?? null,
      dayNight: g.dayNight ?? null,
      description: g.description ?? null,
    };
    await db
      .insert(games)
      .values({ mlbGamePk, ...details })
      .onConflictDoUpdate({ target: games.mlbGamePk, set: details });
  }

  console.log(`Seeded ${home.length} Giants home games for ${season}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
