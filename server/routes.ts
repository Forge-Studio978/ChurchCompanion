import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, registerAuthRoutes } from "./replit_integrations/auth";
import { seedBibleData } from "./seed/bible";
import { seedHymnsData } from "./seed/hymns";
import { seedDailyDevotionals } from "./seed/daily-devotionals";
import { 
  createTranscript, 
  getTranscriptByLivestream, 
  getTranscriptSegments,
  analyzeTranscriptText,
  saveTranscriptSegments 
} from "./services/ai-transcription";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

  await seedBibleData();
  await seedHymnsData();
  await seedDailyDevotionals();

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

  app.get("/api/daily-devotional", async (req, res) => {
    try {
      const now = new Date();
      const startOfYear = Date.UTC(now.getUTCFullYear(), 0, 0);
      const nowUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
      const dayOfYear = Math.floor((nowUTC - startOfYear) / (1000 * 60 * 60 * 24));
      
      let devotional = await storage.getDailyDevotional(dayOfYear);
      if (!devotional) {
        const fallbackDay = ((dayOfYear - 1) % 31) + 1;
        devotional = await storage.getDailyDevotional(fallbackDay);
      }
      if (!devotional) {
        return res.status(404).json({ message: "No devotional available for today" });
      }
      res.json(devotional);
    } catch (error) {
      console.error("Error getting daily devotional:", error);
      res.status(500).json({ message: "Failed to get daily devotional" });
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

  app.get("/api/livestreams", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const streams = await storage.getLivestreams(userId);
      res.json(streams);
    } catch (error) {
      console.error("Error getting livestreams:", error);
      res.status(500).json({ message: "Failed to get livestreams" });
    }
  });

  app.get("/api/livestreams/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const stream = await storage.getLivestream(id, userId);
      if (!stream) {
        return res.status(404).json({ message: "Livestream not found" });
      }
      res.json(stream);
    } catch (error) {
      console.error("Error getting livestream:", error);
      res.status(500).json({ message: "Failed to get livestream" });
    }
  });

  app.post("/api/livestreams", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { title, description, sourceUrl, sourceType } = req.body;
      const stream = await storage.createLivestream({
        userId,
        title,
        description,
        sourceUrl,
        sourceType: sourceType || "youtube",
      });
      res.json(stream);
    } catch (error) {
      console.error("Error creating livestream:", error);
      res.status(500).json({ message: "Failed to create livestream" });
    }
  });

  app.patch("/api/livestreams/:id/position", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const { position } = req.body;
      await storage.updateLivestreamPosition(id, userId, position);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating position:", error);
      res.status(500).json({ message: "Failed to update position" });
    }
  });

  app.delete("/api/livestreams/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      await storage.deleteLivestream(id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting livestream:", error);
      res.status(500).json({ message: "Failed to delete livestream" });
    }
  });

  app.get("/api/livestreams/:id/notes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const livestreamId = parseInt(req.params.id);
      const notes = await storage.getLivestreamNotes(livestreamId, userId);
      res.json(notes);
    } catch (error) {
      console.error("Error getting livestream notes:", error);
      res.status(500).json({ message: "Failed to get notes" });
    }
  });

  app.get("/api/livestream-notes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notes = await storage.getLivestreamNotesWithContext(userId);
      res.json(notes);
    } catch (error) {
      console.error("Error getting all livestream notes:", error);
      res.status(500).json({ message: "Failed to get notes" });
    }
  });

  app.post("/api/livestream-notes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { livestreamId, timestampSeconds, content, bibleReference, hymnId } = req.body;
      const note = await storage.createLivestreamNote({
        userId,
        livestreamId,
        timestampSeconds: timestampSeconds || 0,
        content,
        bibleReference,
        hymnId,
      });
      res.json(note);
    } catch (error) {
      console.error("Error creating livestream note:", error);
      res.status(500).json({ message: "Failed to create note" });
    }
  });

  app.delete("/api/livestream-notes/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      await storage.deleteLivestreamNote(id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting livestream note:", error);
      res.status(500).json({ message: "Failed to delete note" });
    }
  });

  app.get("/api/livestreams/:id/detected-verses", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const livestreamId = parseInt(req.params.id);
      const livestream = await storage.getLivestream(livestreamId, userId);
      if (!livestream) {
        return res.status(404).json({ message: "Livestream not found" });
      }
      const verses = await storage.getDetectedVerses(livestreamId);
      res.json(verses);
    } catch (error) {
      console.error("Error getting detected verses:", error);
      res.status(500).json({ message: "Failed to get detected verses" });
    }
  });

  app.post("/api/livestreams/:id/detected-verses", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const livestreamId = parseInt(req.params.id);
      const livestream = await storage.getLivestream(livestreamId, userId);
      if (!livestream) {
        return res.status(404).json({ message: "Livestream not found" });
      }
      const { bibleReference, timestampSeconds } = req.body;
      const verse = await storage.addDetectedVerse({
        livestreamId,
        bibleReference,
        timestampSeconds,
      });
      res.json(verse);
    } catch (error) {
      console.error("Error adding detected verse:", error);
      res.status(500).json({ message: "Failed to add detected verse" });
    }
  });

  app.get("/api/livestreams/:id/detected-hymns", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const livestreamId = parseInt(req.params.id);
      const livestream = await storage.getLivestream(livestreamId, userId);
      if (!livestream) {
        return res.status(404).json({ message: "Livestream not found" });
      }
      const hymns = await storage.getDetectedHymns(livestreamId);
      res.json(hymns);
    } catch (error) {
      console.error("Error getting detected hymns:", error);
      res.status(500).json({ message: "Failed to get detected hymns" });
    }
  });

  app.post("/api/livestreams/:id/detected-hymns", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const livestreamId = parseInt(req.params.id);
      const livestream = await storage.getLivestream(livestreamId, userId);
      if (!livestream) {
        return res.status(404).json({ message: "Livestream not found" });
      }
      const { hymnId, title, timestampSeconds } = req.body;
      const hymn = await storage.addDetectedHymn({
        livestreamId,
        hymnId,
        title,
        timestampSeconds,
      });
      res.json(hymn);
    } catch (error) {
      console.error("Error adding detected hymn:", error);
      res.status(500).json({ message: "Failed to add detected hymn" });
    }
  });

  app.get("/api/livestreams/:id/transcript", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const livestreamId = parseInt(req.params.id);
      const livestream = await storage.getLivestream(livestreamId, userId);
      if (!livestream) {
        return res.status(404).json({ message: "Livestream not found" });
      }
      const transcript = await getTranscriptByLivestream(livestreamId);
      if (!transcript) {
        return res.json({ status: "none", segments: [] });
      }
      const segments = await getTranscriptSegments(transcript.id);
      res.json({ ...transcript, segments });
    } catch (error) {
      console.error("Error getting transcript:", error);
      res.status(500).json({ message: "Failed to get transcript" });
    }
  });

  app.post("/api/livestreams/:id/transcript", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const livestreamId = parseInt(req.params.id);
      const livestream = await storage.getLivestream(livestreamId, userId);
      if (!livestream) {
        return res.status(404).json({ message: "Livestream not found" });
      }
      const existingTranscript = await getTranscriptByLivestream(livestreamId);
      if (existingTranscript) {
        return res.json({ message: "Transcript already exists", transcriptId: existingTranscript.id });
      }
      const transcriptId = await createTranscript(livestreamId);
      res.json({ transcriptId, status: "pending" });
    } catch (error) {
      console.error("Error creating transcript:", error);
      res.status(500).json({ message: "Failed to create transcript" });
    }
  });

  app.post("/api/livestreams/:id/transcript/analyze", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const livestreamId = parseInt(req.params.id);
      const livestream = await storage.getLivestream(livestreamId, userId);
      if (!livestream) {
        return res.status(404).json({ message: "Livestream not found" });
      }
      const { text, segments } = req.body;
      
      let transcript = await getTranscriptByLivestream(livestreamId);
      if (!transcript) {
        const transcriptId = await createTranscript(livestreamId);
        transcript = { id: transcriptId, livestreamId, status: "pending", createdAt: new Date(), completedAt: null };
      }
      
      if (segments?.length) {
        await saveTranscriptSegments(transcript.id, segments);
      }
      
      const result = await analyzeTranscriptText(livestreamId, transcript.id, text || "");
      res.json(result);
    } catch (error) {
      console.error("Error analyzing transcript:", error);
      res.status(500).json({ message: "Failed to analyze transcript" });
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
