
import { migrate } from "drizzle-orm/neon-http/migrator";
import { db } from "./index";

async function runMigrations() {
  console.log("⏳ Applying database migrations to Neon PostgreSQL...");

  try {
    await migrate(db, {
      migrationsFolder: "./src/db/migrations",
    });

    console.log("✅ Database migrations applied successfully!");
  } catch (error) {
    console.error("❌ Database migration failed:", error);
    process.exitCode = 1;
  }
}

runMigrations();
