import { db } from "../db";
import { bibleVerses } from "@shared/schema";
import Database from "better-sqlite3";
import path from "path";

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

let seeded = false;

export async function seedBibleData() {
  if (seeded) return;
  
  try {
    const existing = await db.select().from(bibleVerses).limit(1);
    if (existing.length > 0) {
      console.log("Bible data already seeded, skipping...");
      seeded = true;
      return;
    }

    const sqlitePath = "/tmp/extracted_data/EN-English/kjv.sqlite";
    
    try {
      const sqlite = new Database(sqlitePath, { readonly: true });
      const rows = sqlite.prepare("SELECT book, chapter, verse, text FROM verses ORDER BY book, chapter, verse").all() as Array<{
        book: number;
        chapter: number;
        verse: number;
        text: string;
      }>;

      console.log(`Importing ${rows.length} Bible verses...`);

      const batchSize = 500;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize).map(row => ({
          book: BOOK_NAMES[row.book] || `Book ${row.book}`,
          chapter: row.chapter,
          verse: row.verse,
          text: row.text.replace(/[¶\[\]]/g, "").trim(),
          translation: "KJV",
        }));
        
        await db.insert(bibleVerses).values(batch);
        
        if (i % 5000 === 0) {
          console.log(`Imported ${i + batch.length} verses...`);
        }
      }

      sqlite.close();
      console.log("Bible data seeded successfully!");
      seeded = true;
    } catch (err) {
      console.log("Bible SQLite file not found, using sample data...");
      await seedSampleBibleData();
      seeded = true;
    }
  } catch (error) {
    console.error("Error seeding Bible data:", error);
    await seedSampleBibleData();
    seeded = true;
  }
}

async function seedSampleBibleData() {
  const sampleVerses = [
    { book: "John", chapter: 3, verse: 16, text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.", translation: "KJV" },
    { book: "John", chapter: 3, verse: 17, text: "For God sent not his Son into the world to condemn the world; but that the world through him might be saved.", translation: "KJV" },
    { book: "Psalms", chapter: 23, verse: 1, text: "The LORD is my shepherd; I shall not want.", translation: "KJV" },
    { book: "Psalms", chapter: 23, verse: 2, text: "He maketh me to lie down in green pastures: he leadeth me beside the still waters.", translation: "KJV" },
    { book: "Psalms", chapter: 23, verse: 3, text: "He restoreth my soul: he leadeth me in the paths of righteousness for his name's sake.", translation: "KJV" },
    { book: "Psalms", chapter: 23, verse: 4, text: "Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me.", translation: "KJV" },
    { book: "Psalms", chapter: 23, verse: 5, text: "Thou preparest a table before me in the presence of mine enemies: thou anointest my head with oil; my cup runneth over.", translation: "KJV" },
    { book: "Psalms", chapter: 23, verse: 6, text: "Surely goodness and mercy shall follow me all the days of my life: and I will dwell in the house of the LORD for ever.", translation: "KJV" },
    { book: "Proverbs", chapter: 3, verse: 5, text: "Trust in the LORD with all thine heart; and lean not unto thine own understanding.", translation: "KJV" },
    { book: "Proverbs", chapter: 3, verse: 6, text: "In all thy ways acknowledge him, and he shall direct thy paths.", translation: "KJV" },
  ];
  
  await db.insert(bibleVerses).values(sampleVerses);
  console.log("Sample Bible data seeded!");
}
