import { db, client } from "../src/db";
import { sql } from "drizzle-orm";

async function measure() {
  console.log("Starting measure...");
  const t0 = Date.now();
  try {
    const res = await db.execute(sql`SELECT 1 as num;`);
    const t1 = Date.now();
    console.log(`Query 1 took: ${t1 - t0}ms, result:`, res);
    
    const t2 = Date.now();
    const res2 = await db.execute(sql`SELECT 2 as num;`);
    const t3 = Date.now();
    console.log(`Query 2 took: ${t3 - t2}ms, result:`, res2);
  } catch (err) {
    console.error("Measure error:", err);
  } finally {
    if (client) await client.end();
  }
}

measure();
