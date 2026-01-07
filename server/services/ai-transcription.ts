import { GoogleGenAI } from "@google/genai";
import { db } from "../db";
import { transcripts, transcriptSegments, detectedVerses, detectedHymns, hymns, bibleVerses } from "@shared/schema";
import { eq, ilike, or } from "drizzle-orm";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

interface TranscriptionResult {
  transcriptId: number;
  segments: { startSeconds: number; endSeconds: number; text: string }[];
  detectedVerses: { reference: string; timestampSeconds: number }[];
  detectedHymns: { title: string; hymnId: number | null; timestampSeconds: number }[];
}

export async function createTranscript(livestreamId: number): Promise<number> {
  const [transcript] = await db.insert(transcripts).values({
    livestreamId,
    status: "pending",
  }).returning();
  return transcript.id;
}

export async function getTranscriptByLivestream(livestreamId: number) {
  const [transcript] = await db.select().from(transcripts)
    .where(eq(transcripts.livestreamId, livestreamId));
  return transcript;
}

export async function getTranscriptSegments(transcriptId: number) {
  return db.select().from(transcriptSegments)
    .where(eq(transcriptSegments.transcriptId, transcriptId))
    .orderBy(transcriptSegments.startSeconds);
}

export async function analyzeTranscriptText(
  livestreamId: number,
  transcriptId: number,
  rawText: string
): Promise<TranscriptionResult> {
  const segments: { startSeconds: number; endSeconds: number; text: string }[] = [];
  const foundVerses: { reference: string; timestampSeconds: number }[] = [];
  const foundHymns: { title: string; hymnId: number | null; timestampSeconds: number }[] = [];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are analyzing a sermon or worship service transcript. Please extract:

1. Bible references mentioned (book chapter:verse format like "John 3:16", "Romans 10:9-13")
2. Hymn or song titles mentioned or sung

Transcript:
"""
${rawText}
"""

Respond in JSON format:
{
  "bibleReferences": ["John 3:16", "Romans 10:9"],
  "hymnTitles": ["Amazing Grace", "How Great Thou Art"]
}

Only include actual Bible references and hymn titles found. If none found, return empty arrays.`,
    });

    const text = response.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      if (parsed.bibleReferences?.length) {
        for (const ref of parsed.bibleReferences) {
          foundVerses.push({ reference: ref, timestampSeconds: 0 });
          await db.insert(detectedVerses).values({
            livestreamId,
            bibleReference: ref,
            timestampSeconds: 0,
          });
        }
      }
      
      if (parsed.hymnTitles?.length) {
        for (const title of parsed.hymnTitles) {
          const [matchedHymn] = await db.select().from(hymns)
            .where(ilike(hymns.title, `%${title}%`))
            .limit(1);
          
          foundHymns.push({
            title,
            hymnId: matchedHymn?.id || null,
            timestampSeconds: 0,
          });
          
          await db.insert(detectedHymns).values({
            livestreamId,
            hymnId: matchedHymn?.id || null,
            title,
            timestampSeconds: 0,
          });
        }
      }
    }

    await db.update(transcripts)
      .set({ status: "completed", completedAt: new Date() })
      .where(eq(transcripts.id, transcriptId));

  } catch (error) {
    console.error("AI analysis error:", error);
    await db.update(transcripts)
      .set({ status: "failed" })
      .where(eq(transcripts.id, transcriptId));
  }

  return {
    transcriptId,
    segments,
    detectedVerses: foundVerses,
    detectedHymns: foundHymns,
  };
}

export async function saveTranscriptSegments(
  transcriptId: number,
  segments: { startSeconds: number; endSeconds: number; text: string }[]
) {
  if (segments.length === 0) return;
  
  await db.insert(transcriptSegments).values(
    segments.map(s => ({
      transcriptId,
      startSeconds: s.startSeconds,
      endSeconds: s.endSeconds,
      text: s.text,
    }))
  );
}

export async function detectVersesFromText(text: string): Promise<string[]> {
  const bibleRefPattern = /\b(\d?\s?[A-Za-z]+)\s+(\d+):(\d+)(?:-(\d+))?\b/g;
  const matches: string[] = [];
  let match;
  
  while ((match = bibleRefPattern.exec(text)) !== null) {
    matches.push(match[0]);
  }
  
  return matches;
}

export async function getVerseText(reference: string): Promise<string | null> {
  const match = reference.match(/^(\d?\s?[A-Za-z]+)\s+(\d+):(\d+)/);
  if (!match) return null;

  const book = match[1].trim();
  const chapter = parseInt(match[2]);
  const verse = parseInt(match[3]);

  const [bibleVerse] = await db.select().from(bibleVerses)
    .where(
      eq(bibleVerses.book, book)
    )
    .limit(1);

  if (bibleVerse) {
    const [exactVerse] = await db.select().from(bibleVerses)
      .where(
        eq(bibleVerses.chapter, chapter)
      )
      .limit(1);
    
    return exactVerse?.text || null;
  }
  
  return null;
}
