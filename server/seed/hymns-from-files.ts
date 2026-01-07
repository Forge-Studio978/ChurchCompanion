import { db } from "../db";
import { hymns } from "@shared/schema";
import { eq, and } from "drizzle-orm";
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

async function importHymnsFromDirectory(directory: string, language: string, languageName: string, clearExisting: boolean = false): Promise<number> {
  if (!fs.existsSync(directory)) {
    console.log(`Hymn directory not found: ${directory}`);
    return 0;
  }

  const files = fs.readdirSync(directory).filter(f => !f.startsWith('.'));
  
  if (files.length === 0) {
    return 0;
  }

  if (clearExisting) {
    await db.delete(hymns).where(eq(hymns.language, language));
    console.log(`Cleared existing ${languageName} hymns`);
  }

  let importedCount = 0;

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

      const existing = await db.select().from(hymns)
        .where(and(
          eq(hymns.title, parsed.title),
          eq(hymns.language, language)
        ))
        .limit(1);

      if (existing.length > 0) {
        continue;
      }

      await db.insert(hymns).values({
        title: parsed.title,
        lyrics: parsed.lyrics,
        composer: parsed.author || "Traditional",
        language: language,
      });

      importedCount++;
    } catch (error) {
      console.error(`Error parsing hymn file ${file}:`, error);
    }
  }

  if (importedCount > 0) {
    console.log(`Imported ${importedCount} ${languageName} hymns`);
  }
  
  return importedCount;
}

export async function seedHymnsFromFiles() {
  console.log("Checking for hymn files to import...");
  
  const projectRoot = process.cwd();
  const frenchDir = path.join(projectRoot, "attached_assets/hymns_xml/fr");
  const spanishDir = path.join(projectRoot, "attached_assets/hymns_xml/es");
  
  const frenchCount = await importHymnsFromDirectory(frenchDir, "fr", "French", true);
  const spanishCount = await importHymnsFromDirectory(spanishDir, "es", "Spanish", true);
  
  if (spanishCount === 0 && frenchCount === 0) {
    console.log("No new hymns to import from files");
  }
}
