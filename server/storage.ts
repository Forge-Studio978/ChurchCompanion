import {
  bibleVerses, highlights, hymns, savedHymns, playlists, playlistItems,
  sermons, notes, savedVerses, userPreferences,
  type BibleVerse, type InsertBibleVerse, type Highlight, type InsertHighlight,
  type Hymn, type InsertHymn, type SavedHymn, type InsertSavedHymn,
  type Playlist, type InsertPlaylist, type PlaylistItem, type InsertPlaylistItem,
  type Sermon, type InsertSermon, type Note, type InsertNote,
  type SavedVerse, type InsertSavedVerse, type UserPreferences, type InsertUserPreferences,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, like, or, ilike, asc, desc } from "drizzle-orm";

export interface IStorage {
  getVerseOfDay(): Promise<BibleVerse | undefined>;
  getBibleVerses(book: string, chapter: number): Promise<BibleVerse[]>;
  getChapterCount(book: string): Promise<number>;
  searchBibleVerses(query: string): Promise<BibleVerse[]>;
  getBibleVerse(id: number): Promise<BibleVerse | undefined>;
  insertBibleVerse(verse: InsertBibleVerse): Promise<BibleVerse>;
  
  getHighlights(userId: string): Promise<Highlight[]>;
  getHighlightsWithVerses(userId: string): Promise<(Highlight & { verse: BibleVerse })[]>;
  createHighlight(highlight: InsertHighlight): Promise<Highlight>;
  deleteHighlight(id: number, userId: string): Promise<void>;
  
  getHymns(): Promise<Hymn[]>;
  getHymn(id: number): Promise<Hymn | undefined>;
  getHymnTags(): Promise<string[]>;
  insertHymn(hymn: InsertHymn): Promise<Hymn>;
  
  getSavedHymns(userId: string): Promise<SavedHymn[]>;
  getSavedHymnsWithHymns(userId: string): Promise<(SavedHymn & { hymn: Hymn })[]>;
  createSavedHymn(savedHymn: InsertSavedHymn): Promise<SavedHymn>;
  deleteSavedHymn(hymnId: number, userId: string): Promise<void>;
  
  getPlaylists(userId: string): Promise<Playlist[]>;
  createPlaylist(playlist: InsertPlaylist): Promise<Playlist>;
  deletePlaylist(id: number, userId: string): Promise<void>;
  
  getSermons(userId: string): Promise<Sermon[]>;
  getSermon(id: number, userId: string): Promise<Sermon | undefined>;
  createSermon(sermon: InsertSermon): Promise<Sermon>;
  deleteSermon(id: number, userId: string): Promise<void>;
  
  getNotes(userId: string): Promise<Note[]>;
  getNotesForSermon(sermonId: number, userId: string): Promise<Note[]>;
  getNotesWithVerses(userId: string): Promise<(Note & { verse?: BibleVerse })[]>;
  createNote(note: InsertNote): Promise<Note>;
  deleteNote(id: number, userId: string): Promise<void>;
  
  getSavedVerses(userId: string): Promise<SavedVerse[]>;
  getSavedVersesWithVerses(userId: string): Promise<(SavedVerse & { verse: BibleVerse })[]>;
  createSavedVerse(savedVerse: InsertSavedVerse): Promise<SavedVerse>;
  deleteSavedVerse(id: number, userId: string): Promise<void>;
  
  getUserPreferences(userId: string): Promise<UserPreferences | undefined>;
  upsertUserPreferences(prefs: InsertUserPreferences): Promise<UserPreferences>;
}

export class DatabaseStorage implements IStorage {
  async getVerseOfDay(): Promise<BibleVerse | undefined> {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const allVerses = await db.select().from(bibleVerses).limit(1000);
    if (allVerses.length === 0) return undefined;
    return allVerses[dayOfYear % allVerses.length];
  }

  async getBibleVerses(book: string, chapter: number): Promise<BibleVerse[]> {
    return db.select().from(bibleVerses)
      .where(and(eq(bibleVerses.book, book), eq(bibleVerses.chapter, chapter)))
      .orderBy(asc(bibleVerses.verse));
  }

  async getChapterCount(book: string): Promise<number> {
    const result = await db.select({ chapter: bibleVerses.chapter })
      .from(bibleVerses)
      .where(eq(bibleVerses.book, book))
      .groupBy(bibleVerses.chapter)
      .orderBy(desc(bibleVerses.chapter))
      .limit(1);
    return result[0]?.chapter || 1;
  }

  async searchBibleVerses(query: string): Promise<BibleVerse[]> {
    return db.select().from(bibleVerses)
      .where(ilike(bibleVerses.text, `%${query}%`))
      .limit(50);
  }

  async getBibleVerse(id: number): Promise<BibleVerse | undefined> {
    const [verse] = await db.select().from(bibleVerses).where(eq(bibleVerses.id, id));
    return verse;
  }

  async insertBibleVerse(verse: InsertBibleVerse): Promise<BibleVerse> {
    const [newVerse] = await db.insert(bibleVerses).values(verse).returning();
    return newVerse;
  }

  async getHighlights(userId: string): Promise<Highlight[]> {
    return db.select().from(highlights).where(eq(highlights.userId, userId));
  }

  async getHighlightsWithVerses(userId: string): Promise<(Highlight & { verse: BibleVerse })[]> {
    const result = await db.select()
      .from(highlights)
      .innerJoin(bibleVerses, eq(highlights.verseId, bibleVerses.id))
      .where(eq(highlights.userId, userId));
    return result.map(r => ({ ...r.highlights, verse: r.bible_verses }));
  }

  async createHighlight(highlight: InsertHighlight): Promise<Highlight> {
    const existing = await db.select().from(highlights)
      .where(and(eq(highlights.userId, highlight.userId), eq(highlights.verseId, highlight.verseId)));
    if (existing.length > 0) {
      const [updated] = await db.update(highlights)
        .set({ color: highlight.color })
        .where(eq(highlights.id, existing[0].id))
        .returning();
      return updated;
    }
    const [newHighlight] = await db.insert(highlights).values(highlight).returning();
    return newHighlight;
  }

  async deleteHighlight(id: number, userId: string): Promise<void> {
    await db.delete(highlights).where(and(eq(highlights.id, id), eq(highlights.userId, userId)));
  }

  async getHymns(): Promise<Hymn[]> {
    return db.select().from(hymns).orderBy(asc(hymns.title));
  }

  async getHymn(id: number): Promise<Hymn | undefined> {
    const [hymn] = await db.select().from(hymns).where(eq(hymns.id, id));
    return hymn;
  }

  async getHymnTags(): Promise<string[]> {
    const result = await db.select({ tags: hymns.tags }).from(hymns);
    const allTags = new Set<string>();
    result.forEach(r => {
      if (r.tags) r.tags.forEach(t => allTags.add(t));
    });
    return Array.from(allTags).sort();
  }

  async insertHymn(hymn: InsertHymn): Promise<Hymn> {
    const [newHymn] = await db.insert(hymns).values(hymn).returning();
    return newHymn;
  }

  async getSavedHymns(userId: string): Promise<SavedHymn[]> {
    return db.select().from(savedHymns).where(eq(savedHymns.userId, userId));
  }

  async getSavedHymnsWithHymns(userId: string): Promise<(SavedHymn & { hymn: Hymn })[]> {
    const result = await db.select()
      .from(savedHymns)
      .innerJoin(hymns, eq(savedHymns.hymnId, hymns.id))
      .where(eq(savedHymns.userId, userId));
    return result.map(r => ({ ...r.saved_hymns, hymn: r.hymns }));
  }

  async createSavedHymn(savedHymn: InsertSavedHymn): Promise<SavedHymn> {
    const existing = await db.select().from(savedHymns)
      .where(and(eq(savedHymns.userId, savedHymn.userId), eq(savedHymns.hymnId, savedHymn.hymnId)));
    if (existing.length > 0) return existing[0];
    const [newSaved] = await db.insert(savedHymns).values(savedHymn).returning();
    return newSaved;
  }

  async deleteSavedHymn(hymnId: number, userId: string): Promise<void> {
    await db.delete(savedHymns).where(and(eq(savedHymns.hymnId, hymnId), eq(savedHymns.userId, userId)));
  }

  async getPlaylists(userId: string): Promise<Playlist[]> {
    return db.select().from(playlists).where(eq(playlists.userId, userId));
  }

  async createPlaylist(playlist: InsertPlaylist): Promise<Playlist> {
    const [newPlaylist] = await db.insert(playlists).values(playlist).returning();
    return newPlaylist;
  }

  async deletePlaylist(id: number, userId: string): Promise<void> {
    await db.delete(playlists).where(and(eq(playlists.id, id), eq(playlists.userId, userId)));
  }

  async getSermons(userId: string): Promise<Sermon[]> {
    return db.select().from(sermons).where(eq(sermons.userId, userId)).orderBy(desc(sermons.createdAt));
  }

  async getSermon(id: number, userId: string): Promise<Sermon | undefined> {
    const [sermon] = await db.select().from(sermons)
      .where(and(eq(sermons.id, id), eq(sermons.userId, userId)));
    return sermon;
  }

  async createSermon(sermon: InsertSermon): Promise<Sermon> {
    const [newSermon] = await db.insert(sermons).values(sermon).returning();
    return newSermon;
  }

  async deleteSermon(id: number, userId: string): Promise<void> {
    await db.delete(notes).where(eq(notes.sermonId, id));
    await db.delete(sermons).where(and(eq(sermons.id, id), eq(sermons.userId, userId)));
  }

  async getNotes(userId: string): Promise<Note[]> {
    return db.select().from(notes).where(eq(notes.userId, userId)).orderBy(desc(notes.createdAt));
  }

  async getNotesForSermon(sermonId: number, userId: string): Promise<Note[]> {
    return db.select().from(notes)
      .where(and(eq(notes.sermonId, sermonId), eq(notes.userId, userId)))
      .orderBy(asc(notes.createdAt));
  }

  async getNotesWithVerses(userId: string): Promise<(Note & { verse?: BibleVerse })[]> {
    const allNotes = await db.select().from(notes).where(eq(notes.userId, userId)).orderBy(desc(notes.createdAt));
    const result: (Note & { verse?: BibleVerse })[] = [];
    for (const note of allNotes) {
      if (note.verseId) {
        const verse = await this.getBibleVerse(note.verseId);
        result.push({ ...note, verse });
      } else {
        result.push(note);
      }
    }
    return result;
  }

  async createNote(note: InsertNote): Promise<Note> {
    const [newNote] = await db.insert(notes).values(note).returning();
    return newNote;
  }

  async deleteNote(id: number, userId: string): Promise<void> {
    await db.delete(notes).where(and(eq(notes.id, id), eq(notes.userId, userId)));
  }

  async getSavedVerses(userId: string): Promise<SavedVerse[]> {
    return db.select().from(savedVerses).where(eq(savedVerses.userId, userId));
  }

  async getSavedVersesWithVerses(userId: string): Promise<(SavedVerse & { verse: BibleVerse })[]> {
    const result = await db.select()
      .from(savedVerses)
      .innerJoin(bibleVerses, eq(savedVerses.verseId, bibleVerses.id))
      .where(eq(savedVerses.userId, userId))
      .orderBy(desc(savedVerses.createdAt));
    return result.map(r => ({ ...r.saved_verses, verse: r.bible_verses }));
  }

  async createSavedVerse(savedVerse: InsertSavedVerse): Promise<SavedVerse> {
    const existing = await db.select().from(savedVerses)
      .where(and(eq(savedVerses.userId, savedVerse.userId), eq(savedVerses.verseId, savedVerse.verseId)));
    if (existing.length > 0) return existing[0];
    const [newSaved] = await db.insert(savedVerses).values(savedVerse).returning();
    return newSaved;
  }

  async deleteSavedVerse(id: number, userId: string): Promise<void> {
    await db.delete(savedVerses).where(and(eq(savedVerses.id, id), eq(savedVerses.userId, userId)));
  }

  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    const [prefs] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
    return prefs;
  }

  async upsertUserPreferences(prefs: InsertUserPreferences): Promise<UserPreferences> {
    const existing = await this.getUserPreferences(prefs.userId);
    if (existing) {
      const [updated] = await db.update(userPreferences)
        .set(prefs)
        .where(eq(userPreferences.userId, prefs.userId))
        .returning();
      return updated;
    }
    const [newPrefs] = await db.insert(userPreferences).values(prefs).returning();
    return newPrefs;
  }
}

export const storage = new DatabaseStorage();
