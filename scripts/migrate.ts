import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

await migrate(drizzle(pool), { migrationsFolder: "./drizzle" });
await pool.end();

// biome-ignore lint/suspicious/noConsole: standalone migration script
console.log("migrations applied");
