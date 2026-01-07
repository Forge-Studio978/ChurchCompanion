import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// Prefer Supabase pooler connection URL for reliable connectivity
const SUPABASE_POOLER_URL = "postgresql://postgres.zkzfvindmxsunyjltkmf:qR5jCXAgbwWYriw9@aws-1-us-east-2.pooler.supabase.com:5432/postgres";
const databaseUrl = process.env.SUPABASE_DATABASE_URL?.includes("pooler.supabase.com") 
  ? process.env.SUPABASE_DATABASE_URL 
  : SUPABASE_POOLER_URL;

if (!databaseUrl) {
  throw new Error(
    "SUPABASE_DATABASE_URL or DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle(pool, { schema });
