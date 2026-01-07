import { db } from "../db";
import { bibleVerses } from "@shared/schema";
import { eq } from "drizzle-orm";
import Database from "better-sqlite3";
import fs from "fs";

const BOOK_NAMES: Record<number, string> = {
  1: "Genesis", 2: "Exodus", 3: "Leviticus", 4: "Numbers", 5: "Deuteronomy",
  6: "Joshua", 7: "Judges", 8: "Ruth", 9: "1 Samuel", 10: "2 Samuel",
  11: "1 Kings", 12: "2 Kings", 13: "1 Chronicles", 14: "2 Chronicles",
  15: "Ezra", 16: "Nehemiah", 17: "Esther", 18: "Job", 19: "Psalms",
  20: "Proverbs", 21: "Ecclesiastes", 22: "Song of Solomon", 23: "Isaiah",
  24: "Jeremiah", 25: "Lamentations", 26: "Ezekiel", 27: "Daniel",
  28: "Hosea", 29: "Joel", 30: "Amos", 31: "Obadiah", 32: "Jonah",
  33: "Micah", 34: "Nahum", 35: "Habakkuk", 36: "Zephaniah", 37: "Haggai",
  38: "Zechariah", 39: "Malachi", 40: "Matthew", 41: "Mark", 42: "Luke",
  43: "John", 44: "Acts", 45: "Romans", 46: "1 Corinthians", 47: "2 Corinthians",
  48: "Galatians", 49: "Ephesians", 50: "Philippians", 51: "Colossians",
  52: "1 Thessalonians", 53: "2 Thessalonians", 54: "1 Timothy", 55: "2 Timothy",
  56: "Titus", 57: "Philemon", 58: "Hebrews", 59: "James", 60: "1 Peter",
  61: "2 Peter", 62: "1 John", 63: "2 John", 64: "3 John", 65: "Jude", 66: "Revelation"
};

interface BibleVersion {
  path: string;
  translation: string;
  name: string;
}

const BIBLE_VERSIONS: BibleVersion[] = [
  { path: "/tmp/bible_data/FR-Français/segond_1910.sqlite", translation: "LSG", name: "Louis Segond 1910 (French)" },
  { path: "/tmp/bible_data/ES-Español/rv_1909.sqlite", translation: "RV1909", name: "Reina Valera 1909 (Spanish)" },
];

async function importBibleVersion(version: BibleVersion): Promise<boolean> {
  if (!fs.existsSync(version.path)) {
    console.log(`Bible file not found: ${version.path}`);
    return false;
  }

  try {
    const existing = await db.select().from(bibleVerses).where(eq(bibleVerses.translation, version.translation)).limit(1);
    if (existing.length > 0) {
      console.log(`${version.name} already seeded, skipping...`);
      return true;
    }

    const sqlite = new Database(version.path, { readonly: true });
    const rows = sqlite.prepare("SELECT book, chapter, verse, text FROM verses ORDER BY book, chapter, verse").all() as Array<{
      book: number;
      chapter: number;
      verse: number;
      text: string;
    }>;

    console.log(`Importing ${rows.length} verses for ${version.name}...`);

    const batchSize = 500;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize).map(row => ({
        book: BOOK_NAMES[row.book] || `Book ${row.book}`,
        chapter: row.chapter,
        verse: row.verse,
        text: row.text.replace(/[¶\[\]]/g, "").trim(),
        translation: version.translation,
      }));
      
      await db.insert(bibleVerses).values(batch);
      
      if (i % 5000 === 0) {
        console.log(`  Imported ${i + batch.length} verses...`);
      }
    }

    sqlite.close();
    console.log(`${version.name} seeded successfully!`);
    return true;
  } catch (error) {
    console.error(`Error seeding ${version.name}:`, error);
    return false;
  }
}

export async function seedAdditionalBibles() {
  console.log("Checking for additional Bible versions to seed...");
  
  for (const version of BIBLE_VERSIONS) {
    await importBibleVersion(version);
  }
}
