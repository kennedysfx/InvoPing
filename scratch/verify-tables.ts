import { db, client } from "../src/db";
import { sql } from "drizzle-orm";

async function verifyTables() {
  console.log("🔍 Verifying created tables in Neon PostgreSQL database...");
  try {
    const result = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    const rows = result as unknown as any[];
    console.log(`\nFound ${rows.length} tables in public schema:`);
    rows.forEach((row: any) => {
      console.log(`  - ${row.table_name}`);
    });
  } catch (error) {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  } finally {
    if (client) {
      await client.end();
    }
  }
}

verifyTables();
