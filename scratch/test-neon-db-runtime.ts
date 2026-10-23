import { db } from "../src/db";
import { users } from "../src/db/schema";
import { count } from "drizzle-orm";

async function testRuntime() {
  console.log("Testing runtime database driver (drizzle-orm/neon-http)...");
  const t0 = Date.now();
  try {
    const [result] = await db.select({ userCount: count() }).from(users);
    const t1 = Date.now();
    console.log(`✅ Success! Query executed in ${t1 - t0}ms.`);
    console.log(`   Customer account count in database: ${result.userCount}`);
  } catch (error) {
    console.error("❌ Query failed:", error);
    process.exit(1);
  }
}

testRuntime();
