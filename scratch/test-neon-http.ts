import { neon, neonConfig } from "@neondatabase/serverless";
import fs from "fs";
import path from "path";

// Load .env
const envPath = path.resolve(process.cwd(), ".env");
const content = fs.readFileSync(envPath, "utf-8");
let dbUrl = "";
for (const line of content.split("\n")) {
  if (line.startsWith("DATABASE_URL=")) {
    dbUrl = line.split("=").slice(1).join("=").trim();
  }
}

async function testNeon() {
  console.log("Testing @neondatabase/serverless with HTTP/WebSockets...");
  const t0 = Date.now();
  try {
    const sql = neon(dbUrl);
    const result = await sql`SELECT 1 as num;`;
    const t1 = Date.now();
    console.log(`Success! Result:`, result, `Time: ${t1 - t0}ms`);
  } catch (err) {
    console.error("Neon error:", err);
  }
}

testNeon();
