import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Next.js reads .env.local; make the CLI scripts see the same file.
config({ path: [".env.local", ".env"], quiet: true });

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "file:local.db",
    authToken: process.env.DATABASE_AUTH_TOKEN,
  },
});
