import { defineConfig } from "drizzle-kit";
import "dotenv/config"; // Ensure dotenv is loaded

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "sqlite", // ✅ Change to "sqlite" for SQLite
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});

