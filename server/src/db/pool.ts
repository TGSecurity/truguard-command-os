import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config({ path: __dirname + "/../../../.env" });

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgres://truguard:truguard_dev_2026@localhost:5432/truguard",
});

export default pool;
