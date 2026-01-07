import {
  bibleVerses, highlights, hymns, savedHymns, playlists, playlistItems,
  sermons, notes, savedVerses, userPreferences, devotionalBooks, devotionalChapters, bookProgress, bookHighlights,
  livestreams, livestreamNotes, detectedVerses, detectedHymns,
  type BibleVerse, type InsertBibleVerse, type Highlight, type InsertHighlight,
  type Hymn, type InsertHymn, type SavedHymn, type InsertSavedHymn,
  type Playlist, type InsertPlaylist, type PlaylistItem, type InsertPlaylistItem,
  type Sermon, type InsertSermon, type Note, type InsertNote,
  type SavedVerse, type InsertSavedVerse, type UserPreferences, type InsertUserPreferences,
  type DevotionalBook, type InsertDevotionalBook, type DevotionalChapter, type InsertDevotionalChapter,
  type BookProgress, type InsertBookProgress, type BookHighlight, type InsertBookHighlight,
  type Livestream, type InsertLivestream, type LivestreamNote, type InsertLivestreamNote,
  type DetectedVerse, type InsertDetectedVerse, type DetectedHymn, type InsertDetectedHymn,
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
  getPlaylistWithHymns(playlistId: number, userId: string): Promise<{ playlist: Playlist; hymns: Hymn[] } | undefined>;
  createPlaylist(playlist: InsertPlaylist): Promise<Playlist>;
  deletePlaylist(id: number, userId: string): Promise<void>;
  addHymnToPlaylist(item: InsertPlaylistItem): Promise<PlaylistItem>;
  removeHymnFromPlaylist(playlistId: number, hymnId: number): Promise<void>;
  reorderPlaylistItems(playlistId: number, items: { hymnId: number; orderIndex: number }[]): Promise<void>;
  
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
  
  getDevotionalBooks(): Promise<DevotionalBook[]>;
  getDevotionalBook(id: number): Promise<DevotionalBook | undefined>;
  getDevotionalChapters(bookId: number): Promise<DevotionalChapter[]>;
  getDevotionalChapter(id: number): Promise<DevotionalChapter | undefined>;
  insertDevotionalBook(book: InsertDevotionalBook): Promise<DevotionalBook>;
  insertDevotionalChapter(chapter: InsertDevotionalChapter): Promise<DevotionalChapter>;
  getBookProgress(userId: string, bookId: number): Promise<BookProgress | undefined>;
  updateBookProgress(progress: InsertBookProgress): Promise<BookProgress>;
  getBookHighlights(userId: string, chapterId: number): Promise<BookHighlight[]>;
  createBookHighlight(highlight: InsertBookHighlight): Promise<BookHighlight>;
  deleteBookHighlight(id: number, userId: string): Promise<void>;
  
  getLivestreams(userId: string): Promise<Livestream[]>;
  getLivestream(id: number, userId: string): Promise<Livestream | undefined>;
  createLivestream(livestream: InsertLivestream): Promise<Livestream>;
  updateLivestreamPosition(id: number, userId: string, position: number): Promise<void>;
  deleteLivestream(id: number, userId: string): Promise<void>;
  
  getLivestreamNotes(livestreamId: number, userId: string): Promise<LivestreamNote[]>;
  getLivestreamNotesWithContext(userId: string): Promise<(LivestreamNote & { livestream: Livestream })[]>;
  createLivestreamNote(note: InsertLivestreamNote): Promise<LivestreamNote>;
  deleteLivestreamNote(id: number, userId: string): Promise<void>;
  
  addDetectedVerse(verse: InsertDetectedVerse): Promise<DetectedVerse>;
  getDetectedVerses(livestreamId: number): Promise<DetectedVerse[]>;
  addDetectedHymn(hymn: InsertDetectedHymn): Promise<DetectedHymn>;
  getDetectedHymns(livestreamId: number): Promise<DetectedHymn[]>;
}

const CURATED_VERSES = [
  { book: "John", chapter: 3, verse: 16 },
  { book: "Psalms", chapter: 23, verse: 1 },
  { book: "Romans", chapter: 8, verse: 28 },
  { book: "Philippians", chapter: 4, verse: 13 },
  { book: "Jeremiah", chapter: 29, verse: 11 },
  { book: "Proverbs", chapter: 3, verse: 5 },
  { book: "Isaiah", chapter: 40, verse: 31 },
  { book: "Matthew", chapter: 6, verse: 33 },
  { book: "Romans", chapter: 12, verse: 2 },
  { book: "Psalms", chapter: 46, verse: 10 },
  { book: "Joshua", chapter: 1, verse: 9 },
  { book: "1 Corinthians", chapter: 13, verse: 4 },
  { book: "Galatians", chapter: 5, verse: 22 },
  { book: "Ephesians", chapter: 2, verse: 8 },
  { book: "Hebrews", chapter: 11, verse: 1 },
  { book: "James", chapter: 1, verse: 2 },
  { book: "1 Peter", chapter: 5, verse: 7 },
  { book: "2 Timothy", chapter: 1, verse: 7 },
  { book: "Psalms", chapter: 27, verse: 1 },
  { book: "Psalms", chapter: 37, verse: 4 },
  { book: "Psalms", chapter: 91, verse: 1 },
  { book: "Psalms", chapter: 119, verse: 105 },
  { book: "Proverbs", chapter: 16, verse: 3 },
  { book: "Isaiah", chapter: 41, verse: 10 },
  { book: "Matthew", chapter: 11, verse: 28 },
  { book: "Matthew", chapter: 28, verse: 20 },
  { book: "John", chapter: 14, verse: 6 },
  { book: "John", chapter: 15, verse: 13 },
  { book: "Romans", chapter: 5, verse: 8 },
  { book: "Romans", chapter: 10, verse: 9 },
  { book: "2 Corinthians", chapter: 5, verse: 17 },
  { book: "Philippians", chapter: 4, verse: 6 },
  { book: "Colossians", chapter: 3, verse: 23 },
  { book: "1 Thessalonians", chapter: 5, verse: 16 },
  { book: "Hebrews", chapter: 12, verse: 2 },
  { book: "1 John", chapter: 4, verse: 19 },
  { book: "Revelation", chapter: 21, verse: 4 },
  { book: "Genesis", chapter: 1, verse: 1 },
  { book: "Deuteronomy", chapter: 31, verse: 6 },
  { book: "Psalms", chapter: 34, verse: 8 },
  { book: "Psalms", chapter: 100, verse: 4 },
  { book: "Psalms", chapter: 139, verse: 14 },
  { book: "Proverbs", chapter: 22, verse: 6 },
  { book: "Isaiah", chapter: 53, verse: 5 },
  { book: "Lamentations", chapter: 3, verse: 22 },
  { book: "Micah", chapter: 6, verse: 8 },
  { book: "Zephaniah", chapter: 3, verse: 17 },
  { book: "Matthew", chapter: 5, verse: 16 },
  { book: "Matthew", chapter: 7, verse: 7 },
  { book: "Luke", chapter: 6, verse: 31 },
  { book: "John", chapter: 1, verse: 1 },
  { book: "John", chapter: 8, verse: 32 },
  { book: "John", chapter: 10, verse: 10 },
  { book: "Acts", chapter: 1, verse: 8 },
  { book: "Romans", chapter: 6, verse: 23 },
  { book: "1 Corinthians", chapter: 10, verse: 13 },
  { book: "Galatians", chapter: 2, verse: 20 },
  { book: "Ephesians", chapter: 4, verse: 32 },
  { book: "Ephesians", chapter: 6, verse: 10 },
  { book: "Philippians", chapter: 2, verse: 3 },
  { book: "Colossians", chapter: 3, verse: 2 },
  { book: "2 Timothy", chapter: 3, verse: 16 },
  { book: "Hebrews", chapter: 4, verse: 16 },
  { book: "James", chapter: 4, verse: 7 },
  { book: "1 John", chapter: 1, verse: 9 },
];

export class DatabaseStorage implements IStorage {
  async getVerseOfDay(): Promise<BibleVerse | undefined> {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const curatedIndex = dayOfYear % CURATED_VERSES.length;
    const target = CURATED_VERSES[curatedIndex];
    
    const [verse] = await db.select().from(bibleVerses)
      .where(and(
        eq(bibleVerses.book, target.book),
        eq(bibleVerses.chapter, target.chapter),
        eq(bibleVerses.verse, target.verse)
      ));
    
    if (verse) return verse;
    
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
    return db.select().from(playlists).where(eq(playlists.userId, userId)).orderBy(desc(playlists.createdAt));
  }

  async getPlaylistWithHymns(playlistId: number, userId: string): Promise<{ playlist: Playlist; hymns: Hymn[] } | undefined> {
    const [playlist] = await db.select().from(playlists)
      .where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId)));
    if (!playlist) return undefined;
    
    const items = await db.select()
      .from(playlistItems)
      .innerJoin(hymns, eq(playlistItems.hymnId, hymns.id))
      .where(eq(playlistItems.playlistId, playlistId))
      .orderBy(asc(playlistItems.orderIndex));
    
    return { playlist, hymns: items.map(i => i.hymns) };
  }

  async createPlaylist(playlist: InsertPlaylist): Promise<Playlist> {
    const [newPlaylist] = await db.insert(playlists).values(playlist).returning();
    return newPlaylist;
  }

  async deletePlaylist(id: number, userId: string): Promise<void> {
    await db.delete(playlistItems).where(eq(playlistItems.playlistId, id));
    await db.delete(playlists).where(and(eq(playlists.id, id), eq(playlists.userId, userId)));
  }

  async addHymnToPlaylist(item: InsertPlaylistItem): Promise<PlaylistItem> {
    const existing = await db.select().from(playlistItems)
      .where(and(eq(playlistItems.playlistId, item.playlistId), eq(playlistItems.hymnId, item.hymnId)));
    if (existing.length > 0) return existing[0];
    
    const maxOrder = await db.select({ max: playlistItems.orderIndex })
      .from(playlistItems)
      .where(eq(playlistItems.playlistId, item.playlistId));
    const orderIndex = (maxOrder[0]?.max || 0) + 1;
    
    const [newItem] = await db.insert(playlistItems).values({ ...item, orderIndex }).returning();
    return newItem;
  }

  async removeHymnFromPlaylist(playlistId: number, hymnId: number): Promise<void> {
    await db.delete(playlistItems).where(
      and(eq(playlistItems.playlistId, playlistId), eq(playlistItems.hymnId, hymnId))
    );
  }

  async reorderPlaylistItems(playlistId: number, items: { hymnId: number; orderIndex: number }[]): Promise<void> {
    for (const item of items) {
      await db.update(playlistItems)
        .set({ orderIndex: item.orderIndex })
        .where(and(eq(playlistItems.playlistId, playlistId), eq(playlistItems.hymnId, item.hymnId)));
    }
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

  async getDevotionalBooks(): Promise<DevotionalBook[]> {
    return db.select().from(devotionalBooks).where(eq(devotionalBooks.isPublic, true));
  }

  async getUserDevotionalBooks(userId: string): Promise<DevotionalBook[]> {
    return db.select().from(devotionalBooks).where(eq(devotionalBooks.userId, userId));
  }

  async getAllUserBooks(userId: string): Promise<DevotionalBook[]> {
    return db.select().from(devotionalBooks)
      .where(sql`${devotionalBooks.isPublic} = true OR ${devotionalBooks.userId} = ${userId}`);
  }

  async getDevotionalBook(id: number): Promise<DevotionalBook | undefined> {
    const [book] = await db.select().from(devotionalBooks).where(eq(devotionalBooks.id, id));
    return book;
  }

  async deleteDevotionalBook(id: number, userId: string): Promise<void> {
    await db.delete(devotionalChapters).where(eq(devotionalChapters.bookId, id));
    await db.delete(bookProgress).where(eq(bookProgress.bookId, id));
    await db.delete(devotionalBooks).where(and(eq(devotionalBooks.id, id), eq(devotionalBooks.userId, userId)));
  }

  async getDevotionalChapters(bookId: number): Promise<DevotionalChapter[]> {
    return db.select().from(devotionalChapters)
      .where(eq(devotionalChapters.bookId, bookId))
      .orderBy(asc(devotionalChapters.orderIndex));
  }

  async getDevotionalChapter(id: number): Promise<DevotionalChapter | undefined> {
    const [chapter] = await db.select().from(devotionalChapters).where(eq(devotionalChapters.id, id));
    return chapter;
  }

  async insertDevotionalBook(book: InsertDevotionalBook): Promise<DevotionalBook> {
    const [newBook] = await db.insert(devotionalBooks).values(book).returning();
    return newBook;
  }

  async insertDevotionalChapter(chapter: InsertDevotionalChapter): Promise<DevotionalChapter> {
    const [newChapter] = await db.insert(devotionalChapters).values(chapter).returning();
    return newChapter;
  }

  async getBookProgress(userId: string, bookId: number): Promise<BookProgress | undefined> {
    const [progress] = await db.select().from(bookProgress)
      .where(and(eq(bookProgress.userId, userId), eq(bookProgress.bookId, bookId)));
    return progress;
  }

  async updateBookProgress(progress: InsertBookProgress): Promise<BookProgress> {
    const existing = await this.getBookProgress(progress.userId, progress.bookId);
    if (existing) {
      const [updated] = await db.update(bookProgress)
        .set({ currentChapterId: progress.currentChapterId, lastReadAt: new Date() })
        .where(eq(bookProgress.id, existing.id))
        .returning();
      return updated;
    }
    const [newProgress] = await db.insert(bookProgress).values(progress).returning();
    return newProgress;
  }

  async getBookHighlights(userId: string, chapterId: number): Promise<BookHighlight[]> {
    return db.select().from(bookHighlights)
      .where(and(eq(bookHighlights.userId, userId), eq(bookHighlights.chapterId, chapterId)))
      .orderBy(desc(bookHighlights.createdAt));
  }

  async createBookHighlight(highlight: InsertBookHighlight): Promise<BookHighlight> {
    const [newHighlight] = await db.insert(bookHighlights).values(highlight).returning();
    return newHighlight;
  }

  async deleteBookHighlight(id: number, userId: string): Promise<void> {
    await db.delete(bookHighlights).where(and(eq(bookHighlights.id, id), eq(bookHighlights.userId, userId)));
  }

  async getLivestreams(userId: string): Promise<Livestream[]> {
    return db.select().from(livestreams)
      .where(eq(livestreams.userId, userId))
      .orderBy(desc(livestreams.createdAt));
  }

  async getLivestream(id: number, userId: string): Promise<Livestream | undefined> {
    const [livestream] = await db.select().from(livestreams)
      .where(and(eq(livestreams.id, id), eq(livestreams.userId, userId)));
    return livestream;
  }

  async createLivestream(livestream: InsertLivestream): Promise<Livestream> {
    const [newLivestream] = await db.insert(livestreams).values(livestream).returning();
    return newLivestream;
  }

  async updateLivestreamPosition(id: number, userId: string, position: number): Promise<void> {
    await db.update(livestreams)
      .set({ lastViewPosition: position })
      .where(and(eq(livestreams.id, id), eq(livestreams.userId, userId)));
  }

  async deleteLivestream(id: number, userId: string): Promise<void> {
    await db.delete(livestreamNotes).where(eq(livestreamNotes.livestreamId, id));
    await db.delete(detectedVerses).where(eq(detectedVerses.livestreamId, id));
    await db.delete(detectedHymns).where(eq(detectedHymns.livestreamId, id));
    await db.delete(livestreams).where(and(eq(livestreams.id, id), eq(livestreams.userId, userId)));
  }

  async getLivestreamNotes(livestreamId: number, userId: string): Promise<LivestreamNote[]> {
    return db.select().from(livestreamNotes)
      .where(and(eq(livestreamNotes.livestreamId, livestreamId), eq(livestreamNotes.userId, userId)))
      .orderBy(asc(livestreamNotes.timestampSeconds));
  }

  async getLivestreamNotesWithContext(userId: string): Promise<(LivestreamNote & { livestream: Livestream })[]> {
    const result = await db.select()
      .from(livestreamNotes)
      .innerJoin(livestreams, eq(livestreamNotes.livestreamId, livestreams.id))
      .where(eq(livestreamNotes.userId, userId))
      .orderBy(desc(livestreamNotes.createdAt));
    return result.map(r => ({ ...r.livestream_notes, livestream: r.livestreams }));
  }

  async createLivestreamNote(note: InsertLivestreamNote): Promise<LivestreamNote> {
    const [newNote] = await db.insert(livestreamNotes).values(note).returning();
    return newNote;
  }

  async deleteLivestreamNote(id: number, userId: string): Promise<void> {
    await db.delete(livestreamNotes).where(and(eq(livestreamNotes.id, id), eq(livestreamNotes.userId, userId)));
  }

  async addDetectedVerse(verse: InsertDetectedVerse): Promise<DetectedVerse> {
    const [newVerse] = await db.insert(detectedVerses).values(verse).returning();
    return newVerse;
  }

  async getDetectedVerses(livestreamId: number): Promise<DetectedVerse[]> {
    return db.select().from(detectedVerses)
      .where(eq(detectedVerses.livestreamId, livestreamId))
      .orderBy(asc(detectedVerses.timestampSeconds));
  }

  async addDetectedHymn(hymn: InsertDetectedHymn): Promise<DetectedHymn> {
    const [newHymn] = await db.insert(detectedHymns).values(hymn).returning();
    return newHymn;
  }

  async getDetectedHymns(livestreamId: number): Promise<DetectedHymn[]> {
    return db.select().from(detectedHymns)
      .where(eq(detectedHymns.livestreamId, livestreamId))
      .orderBy(asc(detectedHymns.timestampSeconds));
  }
}

export const storage = new DatabaseStorage();
