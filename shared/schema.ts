import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";
export * from "./models/chat";

export const bibleVerses = pgTable("bible_verses", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  book: varchar("book", { length: 50 }).notNull(),
  chapter: integer("chapter").notNull(),
  verse: integer("verse").notNull(),
  text: text("text").notNull(),
  translation: varchar("translation", { length: 20 }).notNull().default("KJV"),
});

export const highlights = pgTable("highlights", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull(),
  verseId: integer("verse_id").notNull(),
  color: varchar("color", { length: 20 }).notNull().default("yellow"),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const hymns = pgTable("hymns", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: varchar("title", { length: 255 }).notNull(),
  lyrics: text("lyrics").notNull(),
  composer: varchar("composer", { length: 255 }),
  year: integer("year"),
  tags: text("tags").array(),
  tune: varchar("tune", { length: 100 }),
  meter: varchar("meter", { length: 50 }),
});

export const savedHymns = pgTable("saved_hymns", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull(),
  hymnId: integer("hymn_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const playlists = pgTable("playlists", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const playlistItems = pgTable("playlist_items", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  playlistId: integer("playlist_id").notNull(),
  hymnId: integer("hymn_id").notNull(),
  orderIndex: integer("order_index").notNull().default(0),
});

export const livestreams = pgTable("livestreams", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  sourceUrl: text("source_url").notNull(),
  sourceType: varchar("source_type", { length: 20 }).default("youtube"),
  lastViewPosition: integer("last_view_position").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const livestreamNotes = pgTable("livestream_notes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull(),
  livestreamId: integer("livestream_id").notNull(),
  timestampSeconds: integer("timestamp_seconds").notNull().default(0),
  content: text("content").notNull(),
  bibleReference: varchar("bible_reference", { length: 100 }),
  hymnId: integer("hymn_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const detectedVerses = pgTable("detected_verses", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  livestreamId: integer("livestream_id").notNull(),
  bibleReference: varchar("bible_reference", { length: 100 }).notNull(),
  timestampSeconds: integer("timestamp_seconds").notNull(),
});

export const detectedHymns = pgTable("detected_hymns", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  livestreamId: integer("livestream_id").notNull(),
  hymnId: integer("hymn_id"),
  title: varchar("title", { length: 255 }),
  timestampSeconds: integer("timestamp_seconds").notNull(),
});

export const transcripts = pgTable("transcripts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  livestreamId: integer("livestream_id").notNull(),
  status: varchar("status", { length: 20 }).default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const transcriptSegments = pgTable("transcript_segments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  transcriptId: integer("transcript_id").notNull(),
  startSeconds: integer("start_seconds").notNull(),
  endSeconds: integer("end_seconds").notNull(),
  text: text("text").notNull(),
});

export const sermons = pgTable("sermons", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  livestreamUrl: text("livestream_url"),
  audioUrl: text("audio_url"),
  textContent: text("text_content"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notes = pgTable("notes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull(),
  sermonId: integer("sermon_id"),
  verseId: integer("verse_id"),
  timestamp: varchar("timestamp", { length: 20 }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const savedVerses = pgTable("saved_verses", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull(),
  verseId: integer("verse_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userPreferences = pgTable("user_preferences", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().unique(),
  preferredBibleVersion: varchar("preferred_bible_version", { length: 20 }).default("KJV"),
  themeMode: varchar("theme_mode", { length: 10 }).default("light"),
  fontSize: varchar("font_size", { length: 10 }).default("medium"),
});

export const devotionalBooks = pgTable("devotional_books", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: varchar("title", { length: 255 }).notNull(),
  author: varchar("author", { length: 255 }),
  description: text("description"),
  coverColor: varchar("cover_color", { length: 20 }).default("#2c4a6e"),
  isPublic: boolean("is_public").default(true),
  userId: varchar("user_id"),
  source: varchar("source", { length: 20 }).default("seeded"),
  gutenbergId: varchar("gutenberg_id", { length: 50 }),
});

export const devotionalChapters = pgTable("devotional_chapters", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  bookId: integer("book_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  orderIndex: integer("order_index").notNull().default(0),
});

export const bookProgress = pgTable("book_progress", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull(),
  bookId: integer("book_id").notNull(),
  currentChapterId: integer("current_chapter_id"),
  lastReadAt: timestamp("last_read_at").defaultNow(),
});

export const bookHighlights = pgTable("book_highlights", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull(),
  chapterId: integer("chapter_id").notNull(),
  highlightedText: text("highlighted_text").notNull(),
  color: varchar("color", { length: 20 }).notNull().default("yellow"),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const highlightsRelations = relations(highlights, ({ one }) => ({
  verse: one(bibleVerses, {
    fields: [highlights.verseId],
    references: [bibleVerses.id],
  }),
}));

export const savedHymnsRelations = relations(savedHymns, ({ one }) => ({
  hymn: one(hymns, {
    fields: [savedHymns.hymnId],
    references: [hymns.id],
  }),
}));

export const playlistItemsRelations = relations(playlistItems, ({ one }) => ({
  playlist: one(playlists, {
    fields: [playlistItems.playlistId],
    references: [playlists.id],
  }),
  hymn: one(hymns, {
    fields: [playlistItems.hymnId],
    references: [hymns.id],
  }),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  sermon: one(sermons, {
    fields: [notes.sermonId],
    references: [sermons.id],
  }),
  verse: one(bibleVerses, {
    fields: [notes.verseId],
    references: [bibleVerses.id],
  }),
}));

export const dailyDevotionals = pgTable("daily_devotionals", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  dayOfYear: integer("day_of_year").notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  scriptureReference: varchar("scripture_reference", { length: 100 }).notNull(),
  scriptureText: text("scripture_text").notNull(),
  reflection: text("reflection").notNull(),
  prayer: text("prayer"),
  author: varchar("author", { length: 100 }),
});

export const savedVersesRelations = relations(savedVerses, ({ one }) => ({
  verse: one(bibleVerses, {
    fields: [savedVerses.verseId],
    references: [bibleVerses.id],
  }),
}));

export const insertBibleVerseSchema = createInsertSchema(bibleVerses).omit({ id: true });
export const insertHighlightSchema = createInsertSchema(highlights).omit({ id: true, createdAt: true });
export const insertHymnSchema = createInsertSchema(hymns).omit({ id: true });
export const insertSavedHymnSchema = createInsertSchema(savedHymns).omit({ id: true, createdAt: true });
export const insertPlaylistSchema = createInsertSchema(playlists).omit({ id: true, createdAt: true });
export const insertPlaylistItemSchema = createInsertSchema(playlistItems).omit({ id: true });
export const insertLivestreamSchema = createInsertSchema(livestreams).omit({ id: true, createdAt: true });
export const insertLivestreamNoteSchema = createInsertSchema(livestreamNotes).omit({ id: true, createdAt: true });
export const insertDetectedVerseSchema = createInsertSchema(detectedVerses).omit({ id: true });
export const insertDetectedHymnSchema = createInsertSchema(detectedHymns).omit({ id: true });
export const insertTranscriptSchema = createInsertSchema(transcripts).omit({ id: true, createdAt: true, completedAt: true });
export const insertTranscriptSegmentSchema = createInsertSchema(transcriptSegments).omit({ id: true });
export const insertSermonSchema = createInsertSchema(sermons).omit({ id: true, createdAt: true });
export const insertNoteSchema = createInsertSchema(notes).omit({ id: true, createdAt: true });
export const insertSavedVerseSchema = createInsertSchema(savedVerses).omit({ id: true, createdAt: true });
export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({ id: true });
export const insertDailyDevotionalSchema = createInsertSchema(dailyDevotionals).omit({ id: true });
export const insertDevotionalBookSchema = createInsertSchema(devotionalBooks).omit({ id: true });
export const insertDevotionalChapterSchema = createInsertSchema(devotionalChapters).omit({ id: true });
export const insertBookProgressSchema = createInsertSchema(bookProgress).omit({ id: true, lastReadAt: true });
export const insertBookHighlightSchema = createInsertSchema(bookHighlights).omit({ id: true, createdAt: true });

export type BibleVerse = typeof bibleVerses.$inferSelect;
export type InsertBibleVerse = z.infer<typeof insertBibleVerseSchema>;
export type Highlight = typeof highlights.$inferSelect;
export type InsertHighlight = z.infer<typeof insertHighlightSchema>;
export type Hymn = typeof hymns.$inferSelect;
export type InsertHymn = z.infer<typeof insertHymnSchema>;
export type SavedHymn = typeof savedHymns.$inferSelect;
export type InsertSavedHymn = z.infer<typeof insertSavedHymnSchema>;
export type Playlist = typeof playlists.$inferSelect;
export type InsertPlaylist = z.infer<typeof insertPlaylistSchema>;
export type PlaylistItem = typeof playlistItems.$inferSelect;
export type InsertPlaylistItem = z.infer<typeof insertPlaylistItemSchema>;
export type Livestream = typeof livestreams.$inferSelect;
export type InsertLivestream = z.infer<typeof insertLivestreamSchema>;
export type LivestreamNote = typeof livestreamNotes.$inferSelect;
export type InsertLivestreamNote = z.infer<typeof insertLivestreamNoteSchema>;
export type DetectedVerse = typeof detectedVerses.$inferSelect;
export type InsertDetectedVerse = z.infer<typeof insertDetectedVerseSchema>;
export type DetectedHymn = typeof detectedHymns.$inferSelect;
export type InsertDetectedHymn = z.infer<typeof insertDetectedHymnSchema>;
export type Transcript = typeof transcripts.$inferSelect;
export type InsertTranscript = z.infer<typeof insertTranscriptSchema>;
export type TranscriptSegment = typeof transcriptSegments.$inferSelect;
export type InsertTranscriptSegment = z.infer<typeof insertTranscriptSegmentSchema>;
export type Sermon = typeof sermons.$inferSelect;
export type InsertSermon = z.infer<typeof insertSermonSchema>;
export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type SavedVerse = typeof savedVerses.$inferSelect;
export type InsertSavedVerse = z.infer<typeof insertSavedVerseSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type DailyDevotional = typeof dailyDevotionals.$inferSelect;
export type InsertDailyDevotional = z.infer<typeof insertDailyDevotionalSchema>;
export type DevotionalBook = typeof devotionalBooks.$inferSelect;
export type InsertDevotionalBook = z.infer<typeof insertDevotionalBookSchema>;
export type DevotionalChapter = typeof devotionalChapters.$inferSelect;
export type InsertDevotionalChapter = z.infer<typeof insertDevotionalChapterSchema>;
export type BookProgress = typeof bookProgress.$inferSelect;
export type InsertBookProgress = z.infer<typeof insertBookProgressSchema>;
export type BookHighlight = typeof bookHighlights.$inferSelect;
export type InsertBookHighlight = z.infer<typeof insertBookHighlightSchema>;
