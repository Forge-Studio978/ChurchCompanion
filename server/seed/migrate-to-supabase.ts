import pg from "pg";

const { Pool } = pg;

const BATCH_SIZE = 500;

async function migrateToSupabase() {
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
    // Check counts in both databases
    const replitCount = await replitPool.query("SELECT COUNT(*) as count FROM bible_verses");
    const supabaseCount = await supabasePool.query("SELECT COUNT(*) as count FROM bible_verses");

    console.log(`Replit database: ${replitCount.rows[0].count} Bible verses`);
    console.log(`Supabase database: ${supabaseCount.rows[0].count} Bible verses`);

    if (parseInt(supabaseCount.rows[0].count) >= parseInt(replitCount.rows[0].count)) {
      console.log("Supabase already has the same or more verses. Skipping migration.");
      return;
    }

    // Clear existing data in Supabase if any
    if (parseInt(supabaseCount.rows[0].count) > 0) {
      console.log("Clearing existing Bible verses in Supabase...");
      await supabasePool.query("DELETE FROM bible_verses");
    }

    // Get all verses from Replit
    console.log("Fetching verses from Replit database...");
    const result = await replitPool.query(
      "SELECT book, chapter, verse, text, translation FROM bible_verses ORDER BY id"
    );
    const verses = result.rows;
    console.log(`Found ${verses.length} verses to migrate`);

    // Insert in batches
    let migrated = 0;
    for (let i = 0; i < verses.length; i += BATCH_SIZE) {
      const batch = verses.slice(i, i + BATCH_SIZE);

      const values: any[] = [];
      const placeholders: string[] = [];

      batch.forEach((v, idx) => {
        const offset = idx * 5;
        placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`);
        values.push(v.book, v.chapter, v.verse, v.text, v.translation);
      });

      await supabasePool.query(
        `INSERT INTO bible_verses (book, chapter, verse, text, translation) VALUES ${placeholders.join(", ")}`,
        values
      );

      migrated += batch.length;
      if (migrated % 5000 === 0 || migrated === verses.length) {
        console.log(`Migrated ${migrated}/${verses.length} verses...`);
      }
    }

    console.log("Bible verses migration complete!");

    // Verify final count
    const finalCount = await supabasePool.query("SELECT COUNT(*) as count FROM bible_verses");
    console.log(`Supabase now has ${finalCount.rows[0].count} Bible verses`);

  } catch (error) {
    console.error("Migration error:", error);
    process.exit(1);
  } finally {
    await replitPool.end();
    await supabasePool.end();
  }
}

migrateToSupabase();
