import { db } from "../db";
import { hymns } from "@shared/schema";
import fs from "fs";
import path from "path";

let seeded = false;

function parseHymnXml(content: string): { title: string; lyrics: string; aka?: string } | null {
  try {
    const titleMatch = content.match(/<title>([\s\S]*?)<\/title>/);
    const lyricsMatch = content.match(/<lyrics>([\s\S]*?)<\/lyrics>/);
    const akaMatch = content.match(/<aka>([\s\S]*?)<\/aka>/);
    
    if (!titleMatch || !lyricsMatch) return null;
    
    let lyrics = lyricsMatch[1]
      .replace(/\[V\d+\]/g, "\n")
      .replace(/\[C\d*\]/g, "\n")
      .replace(/\[B\d*\]/g, "\n")
      .replace(/\[P\d*\]/g, "\n")
      .replace(/\[E\d*\]/g, "\n")
      .replace(/\[T\d*\]/g, "\n")
      .replace(/\[I\d*\]/g, "\n")
      .replace(/\[O\d*\]/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    
    return {
      title: titleMatch[1].trim(),
      lyrics,
      aka: akaMatch?.[1]?.trim(),
    };
  } catch {
    return null;
  }
}

function inferTags(title: string, lyrics: string): string[] {
  const tags: string[] = [];
  const text = (title + " " + lyrics).toLowerCase();
  
  if (text.includes("praise") || text.includes("glory") || text.includes("hallelujah")) tags.push("praise");
  if (text.includes("worship") || text.includes("bow") || text.includes("adore")) tags.push("worship");
  if (text.includes("grace") || text.includes("mercy") || text.includes("forgive")) tags.push("grace");
  if (text.includes("faith") || text.includes("believe") || text.includes("trust")) tags.push("faith");
  if (text.includes("prayer") || text.includes("pray")) tags.push("prayer");
  if (text.includes("love") || text.includes("loved")) tags.push("love");
  if (text.includes("hope")) tags.push("hope");
  if (text.includes("peace") || text.includes("rest")) tags.push("peace");
  if (text.includes("joy") || text.includes("rejoice") || text.includes("celebrate")) tags.push("joy");
  if (text.includes("christmas") || text.includes("born") && text.includes("savior")) tags.push("christmas");
  if (text.includes("cross") || text.includes("calvary") || text.includes("died")) tags.push("easter");
  if (text.includes("heaven") || text.includes("eternal")) tags.push("heaven");
  if (text.includes("holy") || text.includes("spirit")) tags.push("holy spirit");
  if (text.includes("king") || text.includes("lord")) tags.push("kingship");
  
  return tags.length > 0 ? tags : ["hymn"];
}

export async function seedHymnsData() {
  if (seeded) return;
  
  try {
    const existing = await db.select().from(hymns).limit(1);
    if (existing.length > 0) {
      console.log("Hymns data already seeded, skipping...");
      seeded = true;
      return;
    }

    const hymnsDir = "/tmp/extracted_data/en";
    
    if (!fs.existsSync(hymnsDir)) {
      console.log("Hymns directory not found, using sample data...");
      await seedSampleHymns();
      seeded = true;
      return;
    }

    const files = fs.readdirSync(hymnsDir);
    console.log(`Found ${files.length} hymn files to import...`);

    const hymnBatch: Array<{
      title: string;
      lyrics: string;
      composer: string | null;
      year: number | null;
      tags: string[];
      tune: string | null;
      meter: string | null;
    }> = [];

    const seenTitles = new Set<string>();

    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(hymnsDir, file), "utf-8");
        const parsed = parseHymnXml(content);
        
        if (parsed && !seenTitles.has(parsed.title.toLowerCase())) {
          seenTitles.add(parsed.title.toLowerCase());
          
          hymnBatch.push({
            title: parsed.title,
            lyrics: parsed.lyrics,
            composer: null,
            year: null,
            tags: inferTags(parsed.title, parsed.lyrics),
            tune: null,
            meter: null,
          });
        }
      } catch (err) {
        // Skip files that can't be parsed
      }
    }

    console.log(`Importing ${hymnBatch.length} unique hymns...`);

    const batchSize = 100;
    for (let i = 0; i < hymnBatch.length; i += batchSize) {
      const batch = hymnBatch.slice(i, i + batchSize);
      await db.insert(hymns).values(batch);
      
      if (i % 500 === 0) {
        console.log(`Imported ${i + batch.length} hymns...`);
      }
    }

    console.log("Hymns data seeded successfully!");
    seeded = true;
  } catch (error) {
    console.error("Error seeding hymns:", error);
    await seedSampleHymns();
    seeded = true;
  }
}

async function seedSampleHymns() {
  const sampleHymns = [
    {
      title: "Amazing Grace",
      lyrics: "Amazing grace, how sweet the sound\nThat saved a wretch like me!\nI once was lost but now am found,\nWas blind but now I see.\n\n'Twas grace that taught my heart to fear,\nAnd grace my fears relieved;\nHow precious did that grace appear\nThe hour I first believed!",
      composer: "John Newton",
      year: 1779,
      tags: ["grace", "faith", "classic"],
      tune: "New Britain",
      meter: "C.M.",
    },
    {
      title: "How Great Thou Art",
      lyrics: "O Lord my God, when I in awesome wonder\nConsider all the worlds Thy hands have made,\nI see the stars, I hear the rolling thunder,\nThy power throughout the universe displayed.\n\nThen sings my soul, my Savior God, to Thee:\nHow great Thou art, how great Thou art!\nThen sings my soul, my Savior God, to Thee:\nHow great Thou art, how great Thou art!",
      composer: "Carl Boberg",
      year: 1885,
      tags: ["praise", "worship", "creation"],
      tune: null,
      meter: null,
    },
    {
      title: "Great Is Thy Faithfulness",
      lyrics: "Great is Thy faithfulness, O God my Father;\nThere is no shadow of turning with Thee;\nThou changest not, Thy compassions, they fail not;\nAs Thou hast been, Thou forever wilt be.\n\nGreat is Thy faithfulness!\nGreat is Thy faithfulness!\nMorning by morning new mercies I see;\nAll I have needed Thy hand hath provided;\nGreat is Thy faithfulness, Lord, unto me!",
      composer: "Thomas Chisholm",
      year: 1923,
      tags: ["faithfulness", "praise", "classic"],
      tune: null,
      meter: null,
    },
  ];

  await db.insert(hymns).values(sampleHymns);
  console.log("Sample hymns seeded!");
}
