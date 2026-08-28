/**
 * Imports the SF Giants home schedule from MLB's public Stats API.
 *
 *   npm run seed            # current calendar year
 *   npm run seed -- 2027    # a specific season
 *
 * Safe to re-run: existing games keep their status/price/claims; only
 * date/time/opponent are refreshed (handles rescheduled games).
 */
import "dotenv/config";
import { db, games } from "../lib/db";

const GIANTS_TEAM_ID = 137;
const season = process.argv[2] ?? String(new Date().getFullYear());

type MlbSchedule = {
  dates: {
    games: {
      gamePk: number;
      gameDate: string; // UTC ISO
      officialDate: string; // YYYY-MM-DD local
      status: { startTimeTBD?: boolean };
      teams: {
        home: { team: { id: number; name: string } };
        away: { team: { id: number; name: string } };
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
    const row = {
      mlbGamePk: g.gamePk,
      date: g.officialDate,
      time: g.status.startTimeTBD ? "TBD" : timeFmt.format(new Date(g.gameDate)),
      startsAt: g.gameDate,
      opponent: g.teams.away.team.name,
    };
    await db
      .insert(games)
      .values(row)
      .onConflictDoUpdate({
        target: games.mlbGamePk,
        set: { date: row.date, time: row.time, startsAt: row.startsAt, opponent: row.opponent },
      });
  }

  console.log(`Seeded ${home.length} Giants home games for ${season}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
