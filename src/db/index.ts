import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";
import fs from "fs";
import path from "path";

// Ensure .env is loaded when executing CLI scripts (like db:migrate or db:seed)
if (!process.env.DATABASE_URL) {
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx !== -1) {
          const key = trimmed.substring(0, eqIdx).trim();
          let value = trimmed.substring(eqIdx + 1).trim();
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    }
  } catch {
    // Ignore .env loading errors
  }
}

const connectionString = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/invoping";

// Initialize Neon HTTP stateless query client (port 443 HTTPS)
const sqlClient = neon(connectionString);
const dbInstance = drizzle(sqlClient, { schema });

// Export client with a no-op end() method for backward compatibility with scripts invoking client.end()
export const client = Object.assign(sqlClient, {
  end: async () => {},
});

export const db = dbInstance;

export * from "./schema";


