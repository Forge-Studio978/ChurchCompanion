import { db } from "../db";
import { dailyDevotionals } from "@shared/schema";

const DEVOTIONAL_CONTENT = [
  {
    dayOfYear: 1,
    title: "A Fresh Start",
    scriptureReference: "Lamentations 3:22-23",
    scriptureText: "It is of the LORD's mercies that we are not consumed, because his compassions fail not. They are new every morning: great is thy faithfulness.",
    reflection: "Each new day brings fresh mercies from our heavenly Father. Just as the sun rises faithfully each morning, so too does God's love and compassion for us. This new beginning is an invitation to leave behind yesterday's failures and embrace the grace that awaits. Let us approach this day with grateful hearts, knowing that God's faithfulness never wavers.",
    prayer: "Lord, thank You for Your new mercies this morning. Help me to receive Your grace with a grateful heart and to walk faithfully with You today. Amen.",
    author: "Traditional"
  },
  {
    dayOfYear: 2,
    title: "Walking in Trust",
    scriptureReference: "Proverbs 3:5-6",
    scriptureText: "Trust in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.",
    reflection: "True wisdom begins when we acknowledge our limitations and surrender our plans to God. Our human understanding is finite, but God sees the end from the beginning. When we trust Him completely and seek His guidance in every decision, He promises to make our paths straight. This is not passive waiting but active faith that moves forward with confidence in God's leading.",
    prayer: "Father, I surrender my plans and understanding to You. Guide my steps today and help me to trust You completely. Amen.",
    author: "Traditional"
  },
  {
    dayOfYear: 3,
    title: "The Good Shepherd",
    scriptureReference: "Psalm 23:1-3",
    scriptureText: "The LORD is my shepherd; I shall not want. He maketh me to lie down in green pastures: he leadeth me beside the still waters. He restoreth my soul.",
    reflection: "David, once a shepherd himself, understood the intimate care a shepherd provides for his flock. God is our Good Shepherd who provides for all our needs, leads us to places of rest and refreshment, and restores our weary souls. In a world filled with anxiety and unrest, we can find peace knowing that our Shepherd watches over us with tender care.",
    prayer: "Good Shepherd, lead me today beside still waters. Restore my soul and help me to find rest in Your care. Amen.",
    author: "Traditional"
  },
  {
    dayOfYear: 4,
    title: "Strength in Weakness",
    scriptureReference: "2 Corinthians 12:9",
    scriptureText: "And he said unto me, My grace is sufficient for thee: for my strength is made perfect in weakness. Most gladly therefore will I rather glory in my infirmities, that the power of Christ may rest upon me.",
    reflection: "Our culture celebrates strength and self-sufficiency, but God's economy works differently. When we acknowledge our weakness, we create space for God's power to flow through us. Paul discovered that his struggles became opportunities for God's grace to shine. Our limitations are not obstacles to God's work but channels through which His strength is displayed.",
    prayer: "Lord, I bring my weaknesses to You today. May Your strength be made perfect in me, and may others see Your power at work. Amen.",
    author: "Traditional"
  },
  {
    dayOfYear: 5,
    title: "Perfect Peace",
    scriptureReference: "Isaiah 26:3",
    scriptureText: "Thou wilt keep him in perfect peace, whose mind is stayed on thee: because he trusteth in thee.",
    reflection: "Peace is not the absence of trouble but the presence of God in the midst of it. The secret to experiencing this perfect peace lies in where we fix our attention. When our minds dwell on our problems, anxiety grows. When our minds are steadfastly fixed on God, peace floods our hearts. This is an active discipline of redirecting our thoughts toward the One who holds all things in His hands.",
    prayer: "Prince of Peace, help me to keep my mind fixed on You today. Replace my anxious thoughts with Your perfect peace. Amen.",
    author: "Traditional"
  },
  {
    dayOfYear: 6,
    title: "Love One Another",
    scriptureReference: "John 13:34-35",
    scriptureText: "A new commandment I give unto you, That ye love one another; as I have loved you, that ye also love one another. By this shall all men know that ye are my disciples, if ye have love one to another.",
    reflection: "Jesus gave His followers a distinctive mark of identification: not creeds or rituals, but love. This love is not mere sentiment but sacrificial action patterned after Christ's own love for us. When we love others with this kind of love, we become living witnesses of the gospel. The watching world should be able to recognize disciples of Jesus by the way they treat one another.",
    prayer: "Jesus, fill me with Your love today. Help me to love others as You have loved me, so that the world may know I belong to You. Amen.",
    author: "Traditional"
  },
  {
    dayOfYear: 7,
    title: "The Lord's Day Rest",
    scriptureReference: "Hebrews 4:9-10",
    scriptureText: "There remaineth therefore a rest to the people of God. For he that is entered into his rest, he also hath ceased from his own works, as God did from his.",
    reflection: "God established a rhythm of work and rest from the very beginning of creation. The Sabbath rest points us to a deeper rest found in Christ, where we cease striving to earn God's favor and rest in His finished work. Taking time to pause, worship, and reflect is not laziness but a sacred act of trust that God sustains us, not our endless labor.",
    prayer: "Lord, teach me to rest in You. Help me to cease from striving and to find true rest in Your finished work. Amen.",
    author: "Traditional"
  },
  {
    dayOfYear: 8,
    title: "Light of the World",
    scriptureReference: "Matthew 5:14-16",
    scriptureText: "Ye are the light of the world. A city that is set on an hill cannot be hid. Neither do men light a candle, and put it under a bushel, but on a candlestick; and it giveth light unto all that are in the house. Let your light so shine before men, that they may see your good works, and glorify your Father which is in heaven.",
    reflection: "Jesus declares that His followers are meant to be visible, shining lights in a dark world. We are not to hide our faith but to let it illuminate the lives of those around us through our words and actions. The purpose of our good works is not to draw attention to ourselves but to point others to our Father in heaven, who is the source of all light.",
    prayer: "Father, let Your light shine through me today. May my actions and words bring glory to You and draw others to Your love. Amen.",
    author: "Traditional"
  },
  {
    dayOfYear: 9,
    title: "Ask, Seek, Knock",
    scriptureReference: "Matthew 7:7-8",
    scriptureText: "Ask, and it shall be given you; seek, and ye shall find; knock, and it shall be opened unto you: For every one that asketh receiveth; and he that seeketh findeth; and to him that knocketh it shall be opened.",
    reflection: "Jesus invites us into an active, persistent relationship with our heavenly Father through prayer. The verbs ask, seek, and knock suggest increasing intensity and perseverance. God delights to answer the prayers of His children, not because we earn His favor through persistence, but because prayer aligns our hearts with His will and deepens our dependence on Him.",
    prayer: "Heavenly Father, teach me to pray with persistence and faith. Help me to seek You earnestly and to trust in Your good gifts. Amen.",
    author: "Traditional"
  },
  {
    dayOfYear: 10,
    title: "Bearing Fruit",
    scriptureReference: "John 15:4-5",
    scriptureText: "Abide in me, and I in you. As the branch cannot bear fruit of itself, except it abide in the vine; no more can ye, except ye abide in me. I am the vine, ye are the branches: He that abideth in me, and I in him, the same bringeth forth much fruit: for without me ye can do nothing.",
    reflection: "Spiritual fruitfulness is not achieved through human effort but through connection to Christ. Just as a branch draws its life from the vine, we draw our spiritual vitality from Jesus. Abiding speaks of a deep, continuous relationship where we remain connected to Him through prayer, His Word, and obedience. From this intimate union, fruit naturally flows.",
    prayer: "Lord Jesus, help me to abide in You today. May I stay connected to You and bear fruit that glorifies the Father. Amen.",
    author: "Traditional"
  },
  {
    dayOfYear: 11,
    title: "The Armor of God",
    scriptureReference: "Ephesians 6:10-11",
    scriptureText: "Finally, my brethren, be strong in the Lord, and in the power of his might. Put on the whole armour of God, that ye may be able to stand against the wiles of the devil.",
    reflection: "The Christian life is a spiritual battle, and we need divine equipment to stand firm. God has provided complete armor for our protection and victory. Our strength comes not from ourselves but from the Lord and His mighty power. Each piece of armor represents truth, righteousness, peace, faith, salvation, and the Word of God. Dressed in this armor, we can withstand any attack.",
    prayer: "Mighty God, equip me with Your armor today. Help me to stand firm against every scheme of the enemy through Your power. Amen.",
    author: "Traditional"
  },
  {
    dayOfYear: 12,
    title: "The Fruit of the Spirit",
    scriptureReference: "Galatians 5:22-23",
    scriptureText: "But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith, Meekness, temperance: against such there is no law.",
    reflection: "When the Holy Spirit dwells in us, He produces beautiful character qualities that reflect Christ. These fruits are not achieved through self-improvement programs but grow naturally as we yield to the Spirit's work in our lives. Notice that fruit is singular, these qualities are a unified cluster that develops together. As we walk in the Spirit, these traits become increasingly evident in our lives.",
    prayer: "Holy Spirit, cultivate Your fruit in my life. Transform my character to reflect more of Jesus each day. Amen.",
    author: "Traditional"
  },
  {
    dayOfYear: 13,
    title: "Faith in Action",
    scriptureReference: "James 2:17-18",
    scriptureText: "Even so faith, if it hath not works, is dead, being alone. Yea, a man may say, Thou hast faith, and I have works: shew me thy faith without thy works, and I will shew thee my faith by my works.",
    reflection: "True faith is never passive. It expresses itself through action. James is not teaching salvation by works but demonstrating that genuine faith naturally produces good works. Just as a living tree bears fruit, living faith produces obedience and service. Our actions become the evidence of our faith, visible proof of the invisible reality of God's work in our hearts.",
    prayer: "Lord, let my faith be alive and active. Help me to demonstrate my love for You through my actions today. Amen.",
    author: "Traditional"
  },
  {
    dayOfYear: 14,
    title: "God's Unfailing Love",
    scriptureReference: "Romans 8:38-39",
    scriptureText: "For I am persuaded, that neither death, nor life, nor angels, nor principalities, nor powers, nor things present, nor things to come, Nor height, nor depth, nor any other creature, shall be able to separate us from the love of God, which is in Christ Jesus our Lord.",
    reflection: "Paul's triumphant declaration covers every conceivable threat to our security in Christ. Nothing in all creation can sever the bond of love between God and His children. Not life's troubles or death's approach. Not spiritual powers or future uncertainties. This is not wishful thinking but a settled conviction based on the finished work of Christ. We are eternally secure in God's love.",
    prayer: "Father, thank You for Your inseparable love. Help me to rest secure in the knowledge that nothing can come between us. Amen.",
    author: "Traditional"
  },
  {
    dayOfYear: 15,
    title: "The Way, Truth, and Life",
    scriptureReference: "John 14:6",
    scriptureText: "Jesus saith unto him, I am the way, the truth, and the life: no man cometh unto the Father, but by me.",
    reflection: "In a world that offers many paths to God, Jesus makes an exclusive claim. He is not merely showing a way but is Himself the only way to the Father. He is not just teaching truth but is truth incarnate. He does not merely offer life but is the source of all true life. This bold declaration invites us to place all our trust in Christ alone for our relationship with God.",
    prayer: "Lord Jesus, You are my way, my truth, and my life. I trust in You alone for my salvation and my relationship with the Father. Amen.",
    author: "Traditional"
  },
  {
    dayOfYear: 16,
    title: "Forgiveness",
    scriptureReference: "Ephesians 4:32",
    scriptureText: "And be ye kind one to another, tenderhearted, forgiving one another, even as God for Christ's sake hath forgiven you.",
    reflection: "The foundation for forgiving others is the forgiveness we have received from God through Christ. When we remember the enormous debt Christ paid on our behalf, it becomes easier to release others from the smaller debts they owe us. Forgiveness is not a feeling but a choice to release bitterness and extend grace, just as God has done for us.",
    prayer: "Gracious Father, thank You for forgiving me through Christ. Help me to extend that same forgiveness to those who have wronged me. Amen.",
    author: "Traditional"
  },
  {
    dayOfYear: 17,
    title: "Renewed Mind",
    scriptureReference: "Romans 12:2",
    scriptureText: "And be not conformed to this world: but be ye transformed by the renewing of your mind, that ye may prove what is that good, and acceptable, and perfect, will of God.",
    reflection: "Transformation begins in the mind. The world constantly tries to squeeze us into its mold, but God calls us to a different pattern of thinking. As we fill our minds with God's truth through Scripture, prayer, and meditation, our thoughts are renewed. This mental renewal leads to transformed living and enables us to discern and embrace God's perfect will for our lives.",
    prayer: "Lord, renew my mind today. Transform my thoughts to align with Your truth, and help me to resist conformity to the world. Amen.",
    author: "Traditional"
  },
  {
    dayOfYear: 18,
    title: "The Prayer of Faith",
    scriptureReference: "James 5:16",
    scriptureText: "Confess your faults one to another, and pray one for another, that ye may be healed. The effectual fervent prayer of a righteous man availeth much.",
    reflection: "Prayer is powerful! James encourages us to practice both confession and intercession within the community of believers. When we honestly share our struggles and lift one another up in prayer, healing comes in many forms. The fervent prayers of those who walk with God accomplish great things, not because of our righteousness, but because we approach a God who delights to answer.",
    prayer: "Lord, teach me to pray with fervent faith. May my prayers make a difference in the lives of those around me. Amen.",
    author: "Traditional"
  },
  {
    dayOfYear: 19,
    title: "Walking Humbly",
    scriptureReference: "Micah 6:8",
    scriptureText: "He hath shewed thee, O man, what is good; and what doth the LORD require of thee, but to do justly, and to love mercy, and to walk humbly with thy God?",
    reflection: "God's requirements are simple yet profound. He desires justice in our dealings with others, a heart that loves showing mercy, and a humble posture before Him. These three qualities capture the essence of true religion: right actions, compassionate hearts, and dependent spirits. Walking humbly with God means acknowledging our need for Him in every step of life's journey.",
    prayer: "Lord, help me to do justice, love mercy, and walk humbly with You today. May my life reflect these simple yet profound requirements. Amen.",
    author: "Traditional"
  },
  {
    dayOfYear: 20,
    title: "Cast Your Cares",
    scriptureReference: "1 Peter 5:7",
    scriptureText: "Casting all your care upon him; for he careth for you.",
    reflection: "Our worries and burdens are too heavy for us to carry alone, but they are never too heavy for God. Peter invites us to deliberately throw our anxieties onto the Lord. This is not a one-time action but a continual practice of releasing our concerns to Him. The reason we can do this is that He genuinely cares for us. Our troubles matter to Him.",
    prayer: "Caring Father, I cast all my worries and cares upon You today. Thank You for Your tender concern for every detail of my life. Amen.",
    author: "Traditional"
  },
  {
    dayOfYear: 21,
    title: "Hope in God",
    scriptureReference: "Psalm 42:11",
    scriptureText: "Why art thou cast down, O my soul? and why art thou disquieted within me? hope thou in God: for I shall yet praise him, who is the health of my countenance, and my God.",
    reflection: "The psalmist practices honest self-examination, questioning his own despair. Depression and discouragement are real, but they need not have the final word. By directing his soul to hope in God, he finds the path to renewed praise. In seasons of darkness, we too can preach truth to ourselves and anchor our hope in the unchanging character of God.",
    prayer: "Lord, when my soul is downcast, help me to hope in You. Lift my eyes from my circumstances to Your faithful character. Amen.",
    author: "Traditional"
  },
  {
    dayOfYear: 22,
    title: "Seek First the Kingdom",
    scriptureReference: "Matthew 6:33",
    scriptureText: "But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.",
    reflection: "Jesus addresses our tendency toward anxiety by redirecting our priorities. When we put God's kingdom and righteousness first, He takes care of our material needs. This does not mean we neglect our responsibilities, but that we order our lives around eternal priorities. God promises to provide for those who seek Him above all else.",
    prayer: "Father, help me to seek Your kingdom first today. I trust You to provide for all my needs as I pursue Your righteousness. Amen.",
    author: "Traditional"
  },
  {
    dayOfYear: 23,
    title: "Be Still and Know",
    scriptureReference: "Psalm 46:10",
    scriptureText: "Be still, and know that I am God: I will be exalted among the heathen, I will be exalted in the earth.",
    reflection: "In a world of constant noise and activity, God calls us to stillness. This is not mere inactivity but a deliberate quieting of our souls to recognize God's sovereignty. When we cease our striving and acknowledge who He is, we find peace. God is in control, and He will be glorified throughout the earth. Our stillness becomes an act of trust.",
    prayer: "Lord, quiet my restless heart. Help me to be still and to know that You are God, sovereign over all things. Amen.",
    author: "Traditional"
  },
  {
    dayOfYear: 24,
    title: "God's Faithfulness",
    scriptureReference: "1 Corinthians 10:13",
    scriptureText: "There hath no temptation taken you but such as is common to man: but God is faithful, who will not suffer you to be tempted above that ye are able; but will with the temptation also make a way to escape, that ye may be able to bear it.",
    reflection: "Temptation is a universal human experience, but we are never alone in our struggles. God's faithfulness guarantees that He will limit the intensity of our temptations and always provide a way of escape. This promise does not mean temptation will be easy, but that victory is always possible. Look for the door He provides and walk through it.",
    prayer: "Faithful God, thank You for limiting my temptations and providing escape routes. Help me to recognize and take the way out You provide. Amen.",
    author: "Traditional"
  },
  {
    dayOfYear: 25,
    title: "Created for Good Works",
    scriptureReference: "Ephesians 2:10",
    scriptureText: "For we are his workmanship, created in Christ Jesus unto good works, which God hath before ordained that we should walk in them.",
    reflection: "We are God's masterpiece, His creative work of art. He has crafted us with intention and purpose. Before the foundation of the world, He prepared specific good works for each of us to accomplish. Our lives have meaning and direction because God has designed a path for us to walk. Every day is an opportunity to fulfill His purposes.",
    prayer: "Creator God, thank You for making me Your masterpiece. Lead me today into the good works You have prepared for me. Amen.",
    author: "Traditional"
  },
  {
    dayOfYear: 26,
    title: "Words of Life",
    scriptureReference: "Proverbs 18:21",
    scriptureText: "Death and life are in the power of the tongue: and they that love it shall eat the fruit thereof.",
    reflection: "Our words carry immense power. They can build up or tear down, encourage or discourage, heal or wound. This proverb reminds us that we will reap what we sow with our speech. Those who use their words wisely will enjoy positive fruit, while those who speak carelessly will face consequences. May we choose words that bring life.",
    prayer: "Lord, set a guard over my mouth today. Help my words to bring life and encouragement to everyone I encounter. Amen.",
    author: "Traditional"
  },
  {
    dayOfYear: 27,
    title: "The Lord Is Near",
    scriptureReference: "Philippians 4:5-6",
    scriptureText: "Let your moderation be known unto all men. The Lord is at hand. Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.",
    reflection: "The nearness of the Lord changes everything. Because He is close, we can be gentle with others and free from anxiety. Paul's antidote for worry is prayer combined with thanksgiving. When we bring our concerns to God with grateful hearts, remembering His past faithfulness, peace replaces anxiety. The Lord is at hand, today and always.",
    prayer: "Lord, thank You for Your nearness. I bring my concerns to You with thanksgiving, trusting that You hear and care. Amen.",
    author: "Traditional"
  },
  {
    dayOfYear: 28,
    title: "Running the Race",
    scriptureReference: "Hebrews 12:1-2",
    scriptureText: "Wherefore seeing we also are compassed about with so great a cloud of witnesses, let us lay aside every weight, and the sin which doth so easily beset us, and let us run with patience the race that is set before us, Looking unto Jesus the author and finisher of our faith.",
    reflection: "The Christian life is pictured as a race requiring endurance and focus. We are surrounded by a great company of those who have run before us, cheering us on. To run well, we must strip away anything that hinders us and fix our eyes on Jesus. He is both our example and our strength, the one who initiates and completes our faith.",
    prayer: "Jesus, author and finisher of my faith, help me to run with endurance today. Remove every hindrance and keep my eyes fixed on You. Amen.",
    author: "Traditional"
  },
  {
    dayOfYear: 29,
    title: "New Creation",
    scriptureReference: "2 Corinthians 5:17",
    scriptureText: "Therefore if any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new.",
    reflection: "When we come to Christ, we are not simply improved; we are made entirely new. Our old identity, defined by sin and separation from God, passes away. A new identity emerges as we are united with Christ. This newness affects everything: our desires, our purpose, our relationships, and our destiny. We are new creations with new life.",
    prayer: "Thank You, Lord, for making me a new creation in Christ. Help me to live today in the reality of this new identity. Amen.",
    author: "Traditional"
  },
  {
    dayOfYear: 30,
    title: "The Greatest Love",
    scriptureReference: "John 15:13",
    scriptureText: "Greater love hath no man than this, that a man lay down his life for his friends.",
    reflection: "Jesus defines the ultimate expression of love as self-sacrifice. He spoke these words knowing He would soon demonstrate this love by dying for us on the cross. This sets the standard for our love toward others. We may not be called to literally die for others, but we are called to lives of daily self-sacrifice, putting the needs of others before our own.",
    prayer: "Lord Jesus, thank You for laying down Your life for me. Teach me to love others with the same sacrificial love. Amen.",
    author: "Traditional"
  },
  {
    dayOfYear: 31,
    title: "Dwelling in the Secret Place",
    scriptureReference: "Psalm 91:1-2",
    scriptureText: "He that dwelleth in the secret place of the most High shall abide under the shadow of the Almighty. I will say of the LORD, He is my refuge and my fortress: my God; in him will I trust.",
    reflection: "The secret place speaks of intimate fellowship with God, a hidden sanctuary available to every believer. Those who make their home in this place of communion find themselves protected under the shadow of the Almighty. God becomes our refuge in times of trouble, our fortress against attack. This is not passive protection but active trust that leads us into His presence.",
    prayer: "Most High God, I choose to dwell in Your secret place today. You are my refuge and fortress; in You I trust. Amen.",
    author: "Traditional"
  }
];

export async function seedDailyDevotionals() {
  try {
    const existing = await db.select().from(dailyDevotionals).limit(1);
    if (existing.length > 0) {
      console.log("Daily devotionals already seeded");
      return;
    }

    console.log("Seeding daily devotionals...");
    
    for (const devotional of DEVOTIONAL_CONTENT) {
      await db.insert(dailyDevotionals).values(devotional);
    }
    
    console.log(`Seeded ${DEVOTIONAL_CONTENT.length} daily devotionals`);
  } catch (error) {
    console.error("Error seeding daily devotionals:", error);
  }
}
