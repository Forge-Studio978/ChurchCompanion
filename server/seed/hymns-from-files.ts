import { db } from "../db";
import { hymns } from "@shared/schema";
import { eq, and, count } from "drizzle-orm";
import fs from "fs";
import path from "path";

interface ParsedHymn {
  title: string;
  lyrics: string;
  author: string | null;
  hymnNumber: number | null;
}

function parseHymnXml(content: string): ParsedHymn | null {
  try {
    const titleMatch = content.match(/<title>([^<]+)<\/title>/);
    const lyricsMatch = content.match(/<lyrics>([^]*?)<\/lyrics>/);
    const authorMatch = content.match(/<author>([^<]+)<\/author>/);
    const hymnNumberMatch = content.match(/<hymn_number>(\d+)<\/hymn_number>/);
    
    if (!titleMatch || !lyricsMatch) {
      return null;
    }

    let lyrics = lyricsMatch[1]
      .replace(/\.\w+\s+[\w#]+/g, '')
      .replace(/\[V\d+\]/g, '\n')
      .replace(/\[C\d*\]/g, '\n[Chorus]\n')
      .replace(/\[B\d*\]/g, '\n[Bridge]\n')
      .replace(/\[P\]/g, '\n')
      .replace(/_{2,}/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return {
      title: titleMatch[1].trim(),
      lyrics: lyrics,
      author: authorMatch ? authorMatch[1].trim() : null,
      hymnNumber: hymnNumberMatch ? parseInt(hymnNumberMatch[1]) : null,
    };
  } catch (error) {
    return null;
  }
}

async function importHymnsFromDirectory(directory: string, language: string, languageName: string): Promise<number> {
  if (!fs.existsSync(directory)) {
    console.log(`Hymn directory not found: ${directory}`);
    return 0;
  }

  const existingCount = await db.select({ count: count() }).from(hymns).where(eq(hymns.language, language));
  
  if (existingCount[0].count > 100) {
    console.log(`${languageName} hymns already seeded (${existingCount[0].count} hymns), skipping...`);
    return 0;
  }

  const files = fs.readdirSync(directory).filter(f => !f.startsWith('.'));
  
  if (files.length === 0) {
    return 0;
  }

  console.log(`Importing ${files.length} ${languageName} hymn files...`);

  await db.delete(hymns).where(eq(hymns.language, language));

  const BATCH_SIZE = 100;
  let batch: { title: string; lyrics: string; composer: string; language: string }[] = [];
  let importedCount = 0;
  let processedCount = 0;

  for (const file of files) {
    try {
      const filePath = path.join(directory, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) continue;
      
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = parseHymnXml(content);

      if (!parsed) {
        continue;
      }

      batch.push({
        title: parsed.title,
        lyrics: parsed.lyrics,
        composer: parsed.author || "Traditional",
        language: language,
      });

      if (batch.length >= BATCH_SIZE) {
        await db.insert(hymns).values(batch);
        importedCount += batch.length;
        processedCount += batch.length;
        if (processedCount % 500 === 0) {
          console.log(`  Imported ${processedCount} ${languageName} hymns...`);
        }
        batch = [];
      }
    } catch (error) {
      console.error(`Error parsing hymn file ${file}:`, error);
    }
  }

  if (batch.length > 0) {
    await db.insert(hymns).values(batch);
    importedCount += batch.length;
  }

  console.log(`Successfully imported ${importedCount} ${languageName} hymns`);
  
  return importedCount;
}

export async function seedHymnsFromFiles() {
  console.log("Checking for hymn files to import...");
  
  const projectRoot = process.cwd();
  const frenchDir = path.join(projectRoot, "attached_assets/hymns_xml/fr");
  const spanishDir = path.join(projectRoot, "attached_assets/hymns_xml/es");
  
  const frenchCount = await importHymnsFromDirectory(frenchDir, "fr", "French");
  const spanishCount = await importHymnsFromDirectory(spanishDir, "es", "Spanish");
  
  if (spanishCount === 0 && frenchCount === 0) {
    console.log("No new hymns to import from files");
  }
}
