import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, registerAuthRoutes } from "./replit_integrations/auth";
import { seedBibleData } from "./seed/bible";
import { seedHymnsData } from "./seed/hymns";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

  await seedBibleData();
  await seedHymnsData();

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

  return httpServer;
}
