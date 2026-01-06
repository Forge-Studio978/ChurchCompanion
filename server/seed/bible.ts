import { db } from "../db";
import { bibleVerses } from "@shared/schema";
import { eq } from "drizzle-orm";

const JOHN_CHAPTER_1 = [
  { verse: 1, text: "In the beginning was the Word, and the Word was with God, and the Word was God." },
  { verse: 2, text: "The same was in the beginning with God." },
  { verse: 3, text: "All things were made by him; and without him was not any thing made that was made." },
  { verse: 4, text: "In him was life; and the life was the light of men." },
  { verse: 5, text: "And the light shineth in darkness; and the darkness comprehended it not." },
  { verse: 6, text: "There was a man sent from God, whose name was John." },
  { verse: 7, text: "The same came for a witness, to bear witness of the Light, that all men through him might believe." },
  { verse: 8, text: "He was not that Light, but was sent to bear witness of that Light." },
  { verse: 9, text: "That was the true Light, which lighteth every man that cometh into the world." },
  { verse: 10, text: "He was in the world, and the world was made by him, and the world knew him not." },
  { verse: 11, text: "He came unto his own, and his own received him not." },
  { verse: 12, text: "But as many as received him, to them gave he power to become the sons of God, even to them that believe on his name:" },
  { verse: 13, text: "Which were born, not of blood, nor of the will of the flesh, nor of the will of man, but of God." },
  { verse: 14, text: "And the Word was made flesh, and dwelt among us, (and we beheld his glory, the glory as of the only begotten of the Father,) full of grace and truth." },
];

const JOHN_CHAPTER_3 = [
  { verse: 1, text: "There was a man of the Pharisees, named Nicodemus, a ruler of the Jews:" },
  { verse: 2, text: "The same came to Jesus by night, and said unto him, Rabbi, we know that thou art a teacher come from God: for no man can do these miracles that thou doest, except God be with him." },
  { verse: 3, text: "Jesus answered and said unto him, Verily, verily, I say unto thee, Except a man be born again, he cannot see the kingdom of God." },
  { verse: 14, text: "And as Moses lifted up the serpent in the wilderness, even so must the Son of man be lifted up:" },
  { verse: 15, text: "That whosoever believeth in him should not perish, but have eternal life." },
  { verse: 16, text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life." },
  { verse: 17, text: "For God sent not his Son into the world to condemn the world; but that the world through him might be saved." },
];

const PSALMS_CHAPTER_23 = [
  { verse: 1, text: "The LORD is my shepherd; I shall not want." },
  { verse: 2, text: "He maketh me to lie down in green pastures: he leadeth me beside the still waters." },
  { verse: 3, text: "He restoreth my soul: he leadeth me in the paths of righteousness for his name's sake." },
  { verse: 4, text: "Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me." },
  { verse: 5, text: "Thou preparest a table before me in the presence of mine enemies: thou anointest my head with oil; my cup runneth over." },
  { verse: 6, text: "Surely goodness and mercy shall follow me all the days of my life: and I will dwell in the house of the LORD for ever." },
];

const ROMANS_CHAPTER_8 = [
  { verse: 1, text: "There is therefore now no condemnation to them which are in Christ Jesus, who walk not after the flesh, but after the Spirit." },
  { verse: 28, text: "And we know that all things work together for good to them that love God, to them who are the called according to his purpose." },
  { verse: 31, text: "What shall we then say to these things? If God be for us, who can be against us?" },
  { verse: 37, text: "Nay, in all these things we are more than conquerors through him that loved us." },
  { verse: 38, text: "For I am persuaded, that neither death, nor life, nor angels, nor principalities, nor powers, nor things present, nor things to come," },
  { verse: 39, text: "Nor height, nor depth, nor any other creature, shall be able to separate us from the love of God, which is in Christ Jesus our Lord." },
];

const GENESIS_CHAPTER_1 = [
  { verse: 1, text: "In the beginning God created the heaven and the earth." },
  { verse: 2, text: "And the earth was without form, and void; and darkness was upon the face of the deep. And the Spirit of God moved upon the face of the waters." },
  { verse: 3, text: "And God said, Let there be light: and there was light." },
  { verse: 4, text: "And God saw the light, that it was good: and God divided the light from the darkness." },
  { verse: 5, text: "And God called the light Day, and the darkness he called Night. And the evening and the morning were the first day." },
  { verse: 26, text: "And God said, Let us make man in our image, after our likeness: and let them have dominion over the fish of the sea, and over the fowl of the air, and over the cattle, and over all the earth, and over every creeping thing that creepeth upon the earth." },
  { verse: 27, text: "So God created man in his own image, in the image of God created he him; male and female created he them." },
  { verse: 31, text: "And God saw every thing that he had made, and, behold, it was very good. And the evening and the morning were the sixth day." },
];

const MATTHEW_CHAPTER_5 = [
  { verse: 3, text: "Blessed are the poor in spirit: for theirs is the kingdom of heaven." },
  { verse: 4, text: "Blessed are they that mourn: for they shall be comforted." },
  { verse: 5, text: "Blessed are the meek: for they shall inherit the earth." },
  { verse: 6, text: "Blessed are they which do hunger and thirst after righteousness: for they shall be filled." },
  { verse: 7, text: "Blessed are the merciful: for they shall obtain mercy." },
  { verse: 8, text: "Blessed are the pure in heart: for they shall see God." },
  { verse: 9, text: "Blessed are the peacemakers: for they shall be called the children of God." },
  { verse: 14, text: "Ye are the light of the world. A city that is set on an hill cannot be hid." },
  { verse: 16, text: "Let your light so shine before men, that they may see your good works, and glorify your Father which is in heaven." },
];

const PROVERBS_CHAPTER_3 = [
  { verse: 5, text: "Trust in the LORD with all thine heart; and lean not unto thine own understanding." },
  { verse: 6, text: "In all thy ways acknowledge him, and he shall direct thy paths." },
];

const PHILIPPIANS_CHAPTER_4 = [
  { verse: 4, text: "Rejoice in the Lord always: and again I say, Rejoice." },
  { verse: 6, text: "Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God." },
  { verse: 7, text: "And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus." },
  { verse: 13, text: "I can do all things through Christ which strengtheneth me." },
];

const ISAIAH_CHAPTER_40 = [
  { verse: 28, text: "Hast thou not known? hast thou not heard, that the everlasting God, the LORD, the Creator of the ends of the earth, fainteth not, neither is weary? there is no searching of his understanding." },
  { verse: 29, text: "He giveth power to the faint; and to them that have no might he increaseth strength." },
  { verse: 30, text: "Even the youths shall faint and be weary, and the young men shall utterly fall:" },
  { verse: 31, text: "But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint." },
];

export async function seedBibleData() {
  try {
    const existing = await db.select().from(bibleVerses).limit(1);
    if (existing.length > 0) {
      console.log("Bible data already seeded");
      return;
    }

    console.log("Seeding Bible data...");

    const allVerses = [
      ...GENESIS_CHAPTER_1.map(v => ({ ...v, book: "Genesis", chapter: 1, translation: "KJV" })),
      ...PSALMS_CHAPTER_23.map(v => ({ ...v, book: "Psalms", chapter: 23, translation: "KJV" })),
      ...PROVERBS_CHAPTER_3.map(v => ({ ...v, book: "Proverbs", chapter: 3, translation: "KJV" })),
      ...ISAIAH_CHAPTER_40.map(v => ({ ...v, book: "Isaiah", chapter: 40, translation: "KJV" })),
      ...MATTHEW_CHAPTER_5.map(v => ({ ...v, book: "Matthew", chapter: 5, translation: "KJV" })),
      ...JOHN_CHAPTER_1.map(v => ({ ...v, book: "John", chapter: 1, translation: "KJV" })),
      ...JOHN_CHAPTER_3.map(v => ({ ...v, book: "John", chapter: 3, translation: "KJV" })),
      ...ROMANS_CHAPTER_8.map(v => ({ ...v, book: "Romans", chapter: 8, translation: "KJV" })),
      ...PHILIPPIANS_CHAPTER_4.map(v => ({ ...v, book: "Philippians", chapter: 4, translation: "KJV" })),
    ];

    await db.insert(bibleVerses).values(allVerses);
    console.log(`Seeded ${allVerses.length} Bible verses`);
  } catch (error) {
    console.error("Error seeding Bible data:", error);
  }
}
