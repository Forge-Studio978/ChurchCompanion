import pg from "pg";

const { Pool } = pg;

const BATCH_SIZE = 500;

async function migrateHymnsToSupabase() {
  const replitDbUrl = process.env.DATABASE_URL;
  const supabaseDbUrl = process.env.SUPABASE_DATABASE_URL;

  if (!replitDbUrl) {
    console.error("DATABASE_URL (Replit) is not set");
    process.exit(1);
  }

  if (!supabaseDbUrl) {
    console.error("SUPABASE_DATABASE_URL is not set");
    process.exit(1);
  }

  console.log("Connecting to Replit database...");
  const replitPool = new Pool({ connectionString: replitDbUrl });

  console.log("Connecting to Supabase database...");
  const supabasePool = new Pool({ connectionString: supabaseDbUrl });

  try {
    const replitCount = await replitPool.query("SELECT COUNT(*) as count FROM hymns");
    const supabaseCount = await supabasePool.query("SELECT COUNT(*) as count FROM hymns");

    console.log(`Replit database: ${replitCount.rows[0].count} hymns`);
    console.log(`Supabase database: ${supabaseCount.rows[0].count} hymns`);

    if (parseInt(supabaseCount.rows[0].count) >= parseInt(replitCount.rows[0].count)) {
      console.log("Supabase already has the same or more hymns. Skipping migration.");
      return;
    }

    console.log("Clearing existing hymns in Supabase...");
    await supabasePool.query("DELETE FROM hymns");

    console.log("Fetching hymns from Replit database...");
    const result = await replitPool.query(
      "SELECT title, lyrics, composer, year, tags, tune, meter, language FROM hymns ORDER BY id"
    );
    const hymns = result.rows;
    console.log(`Found ${hymns.length} hymns to migrate`);

    let migrated = 0;
    for (let i = 0; i < hymns.length; i += BATCH_SIZE) {
      const batch = hymns.slice(i, i + BATCH_SIZE);

      const values: any[] = [];
      const placeholders: string[] = [];

      batch.forEach((h, idx) => {
        const offset = idx * 8;
        placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8})`);
        values.push(
          h.title,
          h.lyrics,
          h.composer,
          h.year,
          h.tags,
          h.tune,
          h.meter,
          h.language
        );
      });

      await supabasePool.query(
        `INSERT INTO hymns (title, lyrics, composer, year, tags, tune, meter, language) VALUES ${placeholders.join(", ")}`,
        values
      );

      migrated += batch.length;
      if (migrated % 1000 === 0 || migrated === hymns.length) {
        console.log(`Migrated ${migrated}/${hymns.length} hymns...`);
      }
    }

    console.log("Hymns migration complete!");

    const finalCount = await supabasePool.query("SELECT COUNT(*) as count FROM hymns");
    const byLang = await supabasePool.query("SELECT language, COUNT(*) as count FROM hymns GROUP BY language ORDER BY language");
    console.log(`Supabase now has ${finalCount.rows[0].count} hymns`);
    console.log("By language:", byLang.rows);

  } catch (error) {
    console.error("Migration error:", error);
    process.exit(1);
  } finally {
    await replitPool.end();
    await supabasePool.end();
  }
}

migrateHymnsToSupabase();
