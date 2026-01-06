import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, registerAuthRoutes } from "./replit_integrations/auth";
import { seedBibleData } from "./seed/bible";
import { seedHymnsData } from "./seed/hymns";
import { seedDevotionalBooks } from "./seed/devotional-books";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

  await seedBibleData();
  await seedHymnsData();
  await seedDevotionalBooks();

  app.get("/api/verse-of-day", async (req, res) => {
    try {
      const verse = await storage.getVerseOfDay();
      if (!verse) {
        return res.status(404).json({ message: "No verses available" });
      }
      res.json(verse);
    } catch (error) {
      console.error("Error getting verse of day:", error);
      res.status(500).json({ message: "Failed to get verse of day" });
    }
  });

  app.get("/api/bible/chapters/:book", async (req, res) => {
    try {
      const { book } = req.params;
      const count = await storage.getChapterCount(book);
      res.json(count);
    } catch (error) {
      console.error("Error getting chapter count:", error);
      res.status(500).json({ message: "Failed to get chapter count" });
    }
  });

  app.get("/api/bible/search/:query", async (req, res) => {
    try {
      const { query } = req.params;
      const verses = await storage.searchBibleVerses(query);
      res.json(verses);
    } catch (error) {
      console.error("Error searching Bible:", error);
      res.status(500).json({ message: "Failed to search" });
    }
  });

  app.get("/api/bible/:book/:chapter", async (req, res) => {
    try {
      const { book, chapter } = req.params;
      const verses = await storage.getBibleVerses(book, parseInt(chapter));
      res.json(verses);
    } catch (error) {
      console.error("Error getting Bible verses:", error);
      res.status(500).json({ message: "Failed to get verses" });
    }
  });

  app.get("/api/highlights", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const highlights = await storage.getHighlights(userId);
      res.json(highlights);
    } catch (error) {
      console.error("Error getting highlights:", error);
      res.status(500).json({ message: "Failed to get highlights" });
    }
  });

  app.get("/api/highlights/full", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const highlights = await storage.getHighlightsWithVerses(userId);
      res.json(highlights);
    } catch (error) {
      console.error("Error getting highlights:", error);
      res.status(500).json({ message: "Failed to get highlights" });
    }
  });

  app.post("/api/highlights", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { verseId, color } = req.body;
      const highlight = await storage.createHighlight({ userId, verseId, color });
      res.json(highlight);
    } catch (error) {
      console.error("Error creating highlight:", error);
      res.status(500).json({ message: "Failed to create highlight" });
    }
  });

  app.delete("/api/highlights/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      await storage.deleteHighlight(id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting highlight:", error);
      res.status(500).json({ message: "Failed to delete highlight" });
    }
  });

  app.get("/api/hymns", async (req, res) => {
    try {
      const hymns = await storage.getHymns();
      res.json(hymns);
    } catch (error) {
      console.error("Error getting hymns:", error);
      res.status(500).json({ message: "Failed to get hymns" });
    }
  });

  app.get("/api/hymns/tags", async (req, res) => {
    try {
      const tags = await storage.getHymnTags();
      res.json(tags);
    } catch (error) {
      console.error("Error getting hymn tags:", error);
      res.status(500).json({ message: "Failed to get tags" });
    }
  });

  app.get("/api/hymns/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const hymn = await storage.getHymn(id);
      if (!hymn) {
        return res.status(404).json({ message: "Hymn not found" });
      }
      res.json(hymn);
    } catch (error) {
      console.error("Error getting hymn:", error);
      res.status(500).json({ message: "Failed to get hymn" });
    }
  });

  app.get("/api/saved-hymns", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const saved = await storage.getSavedHymns(userId);
      res.json(saved);
    } catch (error) {
      console.error("Error getting saved hymns:", error);
      res.status(500).json({ message: "Failed to get saved hymns" });
    }
  });

  app.get("/api/saved-hymns/full", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const saved = await storage.getSavedHymnsWithHymns(userId);
      res.json(saved);
    } catch (error) {
      console.error("Error getting saved hymns:", error);
      res.status(500).json({ message: "Failed to get saved hymns" });
    }
  });

  app.post("/api/saved-hymns", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { hymnId } = req.body;
      const saved = await storage.createSavedHymn({ userId, hymnId });
      res.json(saved);
    } catch (error) {
      console.error("Error saving hymn:", error);
      res.status(500).json({ message: "Failed to save hymn" });
    }
  });

  app.delete("/api/saved-hymns/:hymnId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const hymnId = parseInt(req.params.hymnId);
      await storage.deleteSavedHymn(hymnId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing saved hymn:", error);
      res.status(500).json({ message: "Failed to remove saved hymn" });
    }
  });

  app.get("/api/playlists", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const playlistsList = await storage.getPlaylists(userId);
      res.json(playlistsList);
    } catch (error) {
      console.error("Error getting playlists:", error);
      res.status(500).json({ message: "Failed to get playlists" });
    }
  });

  app.get("/api/playlists/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const result = await storage.getPlaylistWithHymns(id, userId);
      if (!result) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      res.json(result);
    } catch (error) {
      console.error("Error getting playlist:", error);
      res.status(500).json({ message: "Failed to get playlist" });
    }
  });

  app.post("/api/playlists", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { title } = req.body;
      const playlist = await storage.createPlaylist({ userId, title });
      res.json(playlist);
    } catch (error) {
      console.error("Error creating playlist:", error);
      res.status(500).json({ message: "Failed to create playlist" });
    }
  });

  app.delete("/api/playlists/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      await storage.deletePlaylist(id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting playlist:", error);
      res.status(500).json({ message: "Failed to delete playlist" });
    }
  });

  app.post("/api/playlists/:id/hymns", isAuthenticated, async (req: any, res) => {
    try {
      const playlistId = parseInt(req.params.id);
      const { hymnId } = req.body;
      const item = await storage.addHymnToPlaylist({ playlistId, hymnId });
      res.json(item);
    } catch (error) {
      console.error("Error adding hymn to playlist:", error);
      res.status(500).json({ message: "Failed to add hymn to playlist" });
    }
  });

  app.delete("/api/playlists/:id/hymns/:hymnId", isAuthenticated, async (req: any, res) => {
    try {
      const playlistId = parseInt(req.params.id);
      const hymnId = parseInt(req.params.hymnId);
      await storage.removeHymnFromPlaylist(playlistId, hymnId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing hymn from playlist:", error);
      res.status(500).json({ message: "Failed to remove hymn from playlist" });
    }
  });

  app.get("/api/sermons", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sermons = await storage.getSermons(userId);
      res.json(sermons);
    } catch (error) {
      console.error("Error getting sermons:", error);
      res.status(500).json({ message: "Failed to get sermons" });
    }
  });

  app.post("/api/sermons", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { title, description, livestreamUrl, audioUrl, textContent } = req.body;
      const sermon = await storage.createSermon({
        userId,
        title,
        description,
        livestreamUrl,
        audioUrl,
        textContent,
      });
      res.json(sermon);
    } catch (error) {
      console.error("Error creating sermon:", error);
      res.status(500).json({ message: "Failed to create sermon" });
    }
  });

  app.delete("/api/sermons/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      await storage.deleteSermon(id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting sermon:", error);
      res.status(500).json({ message: "Failed to delete sermon" });
    }
  });

  app.get("/api/notes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sermonId = req.query.sermonId;
      if (sermonId) {
        const notes = await storage.getNotesForSermon(parseInt(sermonId as string), userId);
        return res.json(notes);
      }
      const notes = await storage.getNotesWithVerses(userId);
      res.json(notes);
    } catch (error) {
      console.error("Error getting notes:", error);
      res.status(500).json({ message: "Failed to get notes" });
    }
  });

  app.post("/api/notes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { sermonId, verseId, content, timestamp } = req.body;
      const note = await storage.createNote({
        userId,
        sermonId,
        verseId,
        content,
        timestamp,
      });
      res.json(note);
    } catch (error) {
      console.error("Error creating note:", error);
      res.status(500).json({ message: "Failed to create note" });
    }
  });

  app.delete("/api/notes/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      await storage.deleteNote(id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting note:", error);
      res.status(500).json({ message: "Failed to delete note" });
    }
  });

  app.get("/api/saved-verses", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const saved = await storage.getSavedVersesWithVerses(userId);
      res.json(saved);
    } catch (error) {
      console.error("Error getting saved verses:", error);
      res.status(500).json({ message: "Failed to get saved verses" });
    }
  });

  app.post("/api/saved-verses", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { verseId } = req.body;
      const saved = await storage.createSavedVerse({ userId, verseId });
      res.json(saved);
    } catch (error) {
      console.error("Error saving verse:", error);
      res.status(500).json({ message: "Failed to save verse" });
    }
  });

  app.delete("/api/saved-verses/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      await storage.deleteSavedVerse(id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing saved verse:", error);
      res.status(500).json({ message: "Failed to remove saved verse" });
    }
  });

  app.get("/api/devotional-books", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const books = await storage.getAllUserBooks(userId);
      res.json(books);
    } catch (error) {
      console.error("Error getting devotional books:", error);
      res.status(500).json({ message: "Failed to get devotional books" });
    }
  });

  app.delete("/api/devotional-books/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      await storage.deleteDevotionalBook(id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting devotional book:", error);
      res.status(500).json({ message: "Failed to delete devotional book" });
    }
  });

  app.get("/api/gutenberg/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.length < 2) {
        return res.json({ results: [] });
      }
      
      // Use gutendex.com API - the official Project Gutenberg catalog API
      // Search without topic filter to get broader results, filter by English language
      const searchUrl = `https://gutendex.com/books?search=${encodeURIComponent(query)}&languages=en`;
      const response = await fetch(searchUrl);
      
      if (!response.ok) {
        throw new Error("Gutenberg search failed");
      }
      
      const data = await response.json();
      
      // Map results and find the best text download URL
      const results = data.results.slice(0, 25).map((book: any) => {
        // Prefer UTF-8 plain text, fallback to other text formats
        const formats = book.formats || {};
        const downloadUrl = 
          formats["text/plain; charset=utf-8"] ||
          formats["text/plain; charset=us-ascii"] ||
          formats["text/plain"] ||
          null;
        
        return {
          gutenbergId: String(book.id),
          title: book.title,
          author: book.authors?.[0]?.name || "Unknown Author",
          subjects: book.subjects?.slice(0, 5) || [],
          downloadUrl,
          languages: book.languages || [],
        };
      }).filter((book: any) => book.downloadUrl); // Only include books with text available
      
      res.json({ results });
    } catch (error) {
      console.error("Error searching Gutenberg:", error);
      res.status(500).json({ message: "Failed to search Gutenberg" });
    }
  });

  app.post("/api/gutenberg/import", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { gutenbergId, title, author, downloadUrl } = req.body;
      
      if (!downloadUrl) {
        return res.status(400).json({ message: "No text version available for this book" });
      }

      const textResponse = await fetch(downloadUrl);
      if (!textResponse.ok) {
        throw new Error("Failed to download book text");
      }
      
      let fullText = await textResponse.text();
      
      if (fullText.length > 2000000) {
        fullText = fullText.substring(0, 2000000);
      }
      
      const startMatch = fullText.match(/\*\*\*\s*START OF (THE|THIS) PROJECT GUTENBERG.*?\*\*\*/i);
      const endMatch = fullText.match(/\*\*\*\s*END OF (THE|THIS) PROJECT GUTENBERG.*?\*\*\*/i);
      
      if (startMatch && endMatch) {
        const startIdx = startMatch.index! + startMatch[0].length;
        const endIdx = endMatch.index!;
        fullText = fullText.substring(startIdx, endIdx).trim();
      }
      
      const chapterPattern = /(?:^|\n)(CHAPTER\s+[IVXLCDM\d]+[.:\s].*?|Chapter\s+\d+[.:\s].*?)(?=\n)/gi;
      const chapterMatches = [...fullText.matchAll(chapterPattern)];
      
      let chapters: { title: string; content: string }[] = [];
      
      if (chapterMatches.length >= 3) {
        for (let i = 0; i < chapterMatches.length; i++) {
          const match = chapterMatches[i];
          const nextMatch = chapterMatches[i + 1];
          const chapterTitle = match[1].trim();
          const startIdx = match.index! + match[0].length;
          const endIdx = nextMatch ? nextMatch.index! : fullText.length;
          const content = fullText.substring(startIdx, endIdx).trim();
          if (content.length > 100) {
            chapters.push({ title: chapterTitle, content });
          }
        }
      }
      
      if (chapters.length < 3) {
        const paragraphs = fullText.split(/\n\s*\n/).filter(p => p.trim().length > 50);
        const chunkSize = Math.ceil(paragraphs.length / 10);
        chapters = [];
        for (let i = 0; i < 10 && i * chunkSize < paragraphs.length; i++) {
          const chunk = paragraphs.slice(i * chunkSize, (i + 1) * chunkSize);
          chapters.push({
            title: `Part ${i + 1}`,
            content: chunk.join("\n\n"),
          });
        }
      }
      
      const book = await storage.insertDevotionalBook({
        title,
        author,
        description: `Imported from Project Gutenberg`,
        isPublic: false,
        userId,
        source: "gutenberg",
        gutenbergId,
      });
      
      for (let i = 0; i < chapters.length; i++) {
        await storage.insertDevotionalChapter({
          bookId: book.id,
          title: chapters[i].title,
          content: chapters[i].content,
          orderIndex: i,
        });
      }
      
      res.json({ success: true, book });
    } catch (error) {
      console.error("Error importing Gutenberg book:", error);
      res.status(500).json({ message: "Failed to import book" });
    }
  });

  app.get("/api/devotional-books/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const book = await storage.getDevotionalBook(id);
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }
      const chapters = await storage.getDevotionalChapters(id);
      res.json({ book, chapters });
    } catch (error) {
      console.error("Error getting devotional book:", error);
      res.status(500).json({ message: "Failed to get devotional book" });
    }
  });

  app.get("/api/devotional-chapters/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const chapter = await storage.getDevotionalChapter(id);
      if (!chapter) {
        return res.status(404).json({ message: "Chapter not found" });
      }
      res.json(chapter);
    } catch (error) {
      console.error("Error getting chapter:", error);
      res.status(500).json({ message: "Failed to get chapter" });
    }
  });

  app.get("/api/book-progress/:bookId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bookId = parseInt(req.params.bookId);
      const progress = await storage.getBookProgress(userId, bookId);
      res.json(progress || null);
    } catch (error) {
      console.error("Error getting book progress:", error);
      res.status(500).json({ message: "Failed to get book progress" });
    }
  });

  app.post("/api/book-progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { bookId, currentChapterId } = req.body;
      const progress = await storage.updateBookProgress({ userId, bookId, currentChapterId });
      res.json(progress);
    } catch (error) {
      console.error("Error updating book progress:", error);
      res.status(500).json({ message: "Failed to update book progress" });
    }
  });

  app.get("/api/book-highlights/:chapterId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const chapterId = parseInt(req.params.chapterId);
      const highlights = await storage.getBookHighlights(userId, chapterId);
      res.json(highlights);
    } catch (error) {
      console.error("Error getting book highlights:", error);
      res.status(500).json({ message: "Failed to get book highlights" });
    }
  });

  app.post("/api/book-highlights", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { chapterId, highlightedText, color, note } = req.body;
      const highlight = await storage.createBookHighlight({ userId, chapterId, highlightedText, color: color || "yellow", note });
      res.json(highlight);
    } catch (error) {
      console.error("Error creating book highlight:", error);
      res.status(500).json({ message: "Failed to create book highlight" });
    }
  });

  app.delete("/api/book-highlights/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      await storage.deleteBookHighlight(id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting book highlight:", error);
      res.status(500).json({ message: "Failed to delete book highlight" });
    }
  });

  return httpServer;
}
