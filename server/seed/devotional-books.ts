import { storage } from "../storage";

const sampleBooks = [
  {
    title: "Morning and Evening",
    author: "Charles Spurgeon",
    description: "A classic collection of daily devotionals offering spiritual nourishment for each morning and evening.",
    coverColor: "#2c4a6e",
    isPublic: true,
    chapters: [
      {
        title: "January 1 - Morning",
        content: `"They are new every morning: great is thy faithfulness." - Lamentations 3:23

The Lord's compassions never fail. They are new every morning; great is thy faithfulness. This is a blessed commencement for the new year. Let us rejoice that the mercy of God is not like a passing shower, but like the sunshine, always shining, always present.

As the sun rises each day without fail, so does the loving-kindness of the Lord appear fresh each morning. His mercies are renewed daily, adapted to our ever-changing needs and circumstances.

What comfort this brings! Yesterday's trials are passed, and with them, yesterday's grace was sufficient. But today brings new challenges, and behold, new mercies await us. The provision matches the need; the supply follows the demand.

Let us begin this year with confidence in God's unfailing faithfulness. Whatever lies ahead, His mercies will be there to meet us, fresh and new, every single morning.`,
        orderIndex: 0,
      },
      {
        title: "January 1 - Evening",
        content: `"We will be glad and rejoice in thee." - Song of Solomon 1:4

The one theme of joy for the believer is their Lord. We shall not cease to be glad when we have exhausted all other sources of gladness, for we may rejoice in Christ forever.

Consider this: earthly friends may leave us, earthly possessions may take wings, earthly joys may fade like summer flowers. But Jesus is the same yesterday, today, and forever. In Him we have a fountain that never runs dry, a sun that never sets, a love that never fails.

Make it your resolution this year to find your chief joy in your Redeemer. When circumstances would steal your peace, turn to Him. When the world disappoints, remember that He never will. His love is eternal, His grace is sufficient, His presence is promised.

Let your evening prayer tonight be this: "Lord, may my joy in Thee increase throughout this coming year. May I find in Thee my all in all."`,
        orderIndex: 1,
      },
      {
        title: "January 2 - Morning",
        content: `"Unto the upright there ariseth light in the darkness." - Psalm 112:4

Darkness is often the path to light. The seed lies buried in the cold earth before it springs into life. The night comes before the dawn. And so it is with the children of God - trials precede triumphs, shadows come before sunshine.

Are you walking through a dark season? Take heart, dear soul. Light is arising even now. Perhaps you cannot see it yet, but God is working behind the scenes of your life, preparing a morning of joy after your night of weeping.

The darkness is not eternal. It cannot be, for our God is light, and He has promised to be with us always. Walk faithfully through this shadowed valley, keeping your eyes fixed on Him. Before long, the darkness will lift, and you will emerge into glorious light, stronger and more radiant than before.

Trust the One who holds both the darkness and the light in His hands. He knows exactly when to turn your night into day.`,
        orderIndex: 2,
      },
    ],
  },
  {
    title: "My Utmost for His Highest",
    author: "Oswald Chambers",
    description: "Timeless wisdom for daily spiritual growth and complete surrender to God's purposes.",
    coverColor: "#4a3c2e",
    isPublic: true,
    chapters: [
      {
        title: "January 1 - Let Us Keep to the Point",
        content: `"My utmost for His highest."

The true test of a saint is not success, but faithfulness. We are not called to be successful in the eyes of the world, but to be faithful in the eyes of God. This is the highest calling any human being can receive.

What does it mean to give our utmost for His highest? It means holding nothing back. It means surrendering our plans, our ambitions, our very selves to the will of God. It means saying, as Jesus said, "Not my will, but Thine be done."

Many Christians settle for far less than God's highest. They are content with comfortable Christianity, with a faith that makes few demands and requires little sacrifice. But this is not what we were created for. We were made for glory - the glory of being fully used by God for His purposes.

This year, let us resolve to give our utmost for His highest. Let nothing be held back. Let every talent, every resource, every moment be laid at His feet for His service.`,
        orderIndex: 0,
      },
      {
        title: "January 2 - Will You Go Out Without Knowing?",
        content: `"He went out, not knowing whither he went." - Hebrews 11:8

This is faith - to go out without knowing where we are going, trusting only in the One who leads. Abraham demonstrated this faith when he left everything familiar to follow God into an unknown land.

Are you being called to step out in faith? Perhaps you sense God leading you in a new direction, but the path is unclear and the destination unknown. This is not a sign that you have misheard; it is the very nature of the life of faith.

Faith does not require a roadmap. It requires a Relationship. When we know the One who leads, we need not know where we are going. His character is our security, His presence is our guide, His promises are our provisions.

Too many of us want certainty before we step out. We want to see the whole path before we take the first step. But faith, by its very nature, walks in the dark with confidence, knowing that the Light walks beside us.

Will you go out without knowing? This is the adventure of faith.`,
        orderIndex: 1,
      },
    ],
  },
  {
    title: "Streams in the Desert",
    author: "L.B. Cowman",
    description: "Comforting devotions drawn from the experiences of those who have walked through life's deserts and found God's refreshing streams.",
    coverColor: "#5a7d6e",
    isPublic: true,
    chapters: [
      {
        title: "January 1 - He Leads Through Deep Waters",
        content: `"When thou passest through the waters, I will be with thee." - Isaiah 43:2

God does not promise that we will not pass through deep waters. He promises something far better - that we will not pass through them alone. His presence is guaranteed in every storm, every flood, every overwhelming circumstance.

Notice that the verse says "when," not "if." Trials are not possibilities; they are certainties. Every life will face deep waters at some point. The question is not whether we will encounter difficulty, but how we will navigate it.

The promise of God's presence transforms everything. The deep waters are no longer places of terror but of discovery. In the depths, we find treasures we never would have found in the shallows. We discover a strength that only comes from leaning wholly on God.

If you are passing through deep waters today, take courage. You are not alone. The One who walked on water walks with you. The One who calmed the storm is in your boat. Trust Him, and you will not be overwhelmed.`,
        orderIndex: 0,
      },
      {
        title: "January 2 - The Ministry of Delay",
        content: `"And she arose and came unto the town." - Ruth 3:15

Sometimes God's delays are not denials but preparations. When answers to our prayers seem slow in coming, it may be that God is doing a deeper work than we can see.

Ruth waited patiently for the outcome of Boaz's promise. She did not rush ahead or take matters into her own hands. She trusted that what had been promised would come to pass in due time.

How different this is from our usual approach! We are so quick to assume that if God has not answered, He must not have heard. Or worse, that He does not care. But nothing could be further from the truth.

God's timing is perfect, even when it feels painfully slow to us. He sees the whole picture while we see only a fragment. He knows what must be prepared, what must be aligned, what must be purified before the answer can come.

Wait patiently for the Lord. He is not idle. He is working all things together for your good, even in the waiting.`,
        orderIndex: 1,
      },
    ],
  },
];

export async function seedDevotionalBooks() {
  console.log("Checking for existing devotional books...");
  const existingBooks = await storage.getDevotionalBooks();
  
  if (existingBooks.length > 0) {
    console.log(`Found ${existingBooks.length} existing devotional books, skipping seed.`);
    return;
  }

  console.log("Seeding devotional books...");
  for (const bookData of sampleBooks) {
    const { chapters, ...book } = bookData;
    const newBook = await storage.insertDevotionalBook(book);
    console.log(`Created book: ${newBook.title}`);

    for (const chapter of chapters) {
      await storage.insertDevotionalChapter({
        bookId: newBook.id,
        ...chapter,
      });
    }
    console.log(`  Added ${chapters.length} chapters`);
  }

  console.log("Devotional books seeding complete!");
}
