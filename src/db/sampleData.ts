// Sample decks offered on first launch (optional, not forced).
export interface SampleCardSeed {
  front: string;
  back: string;
  reading?: string;
  romaji?: string;
  meaning?: string;
  exampleSentence?: string;
  exampleTranslation?: string;
  tags?: string[];
}

export interface SampleDeckSeed {
  name: string;
  description: string;
  language: string;
  cards: SampleCardSeed[];
}

export const SAMPLE_DECKS: SampleDeckSeed[] = [
  {
    name: "Japanese N5",
    description: "Essential JLPT N5 vocabulary for absolute beginners.",
    language: "Japanese",
    cards: [
      { front: "猫", back: "Cat", reading: "ねこ", romaji: "Neko", meaning: "Cat", exampleSentence: "猫が好きです。", exampleTranslation: "I like cats.", tags: ["N5", "Animal"] },
      { front: "犬", back: "Dog", reading: "いぬ", romaji: "Inu", meaning: "Dog", exampleSentence: "犬と散歩する。", exampleTranslation: "I walk with the dog.", tags: ["N5", "Animal"] },
      { front: "水", back: "Water", reading: "みず", romaji: "Mizu", meaning: "Water", exampleSentence: "水を飲みます。", exampleTranslation: "I drink water.", tags: ["N5"] },
      { front: "食べる", back: "To eat", reading: "たべる", romaji: "Taberu", meaning: "To eat", exampleSentence: "毎日ご飯を食べる。", exampleTranslation: "I eat rice every day.", tags: ["N5", "Verb"] },
      { front: "飲む", back: "To drink", reading: "のむ", romaji: "Nomu", meaning: "To drink", exampleSentence: "お茶を飲む。", exampleTranslation: "I drink tea.", tags: ["N5", "Verb"] },
      { front: "見る", back: "To see / watch", reading: "みる", romaji: "Miru", meaning: "To see, to watch", exampleSentence: "映画を見る。", exampleTranslation: "I watch a movie.", tags: ["N5", "Verb"] },
      { front: "行く", back: "To go", reading: "いく", romaji: "Iku", meaning: "To go", exampleSentence: "学校に行く。", exampleTranslation: "I go to school.", tags: ["N5", "Verb"] },
      { front: "学校", back: "School", reading: "がっこう", romaji: "Gakkou", meaning: "School", exampleSentence: "学校は楽しいです。", exampleTranslation: "School is fun.", tags: ["N5"] },
      { front: "先生", back: "Teacher", reading: "せんせい", romaji: "Sensei", meaning: "Teacher", exampleSentence: "先生はやさしいです。", exampleTranslation: "The teacher is kind.", tags: ["N5"] },
      { front: "友達", back: "Friend", reading: "ともだち", romaji: "Tomodachi", meaning: "Friend", exampleSentence: "友達と遊ぶ。", exampleTranslation: "I play with my friend.", tags: ["N5"] },
    ],
  },
  {
    name: "Travel Japanese",
    description: "Handy words and phrases for traveling in Japan.",
    language: "Japanese",
    cards: [
      { front: "空港", back: "Airport", reading: "くうこう", romaji: "Kuukou", meaning: "Airport", exampleSentence: "空港までお願いします。", exampleTranslation: "To the airport, please.", tags: ["Travel"] },
      { front: "駅", back: "Station", reading: "えき", romaji: "Eki", meaning: "Station", exampleSentence: "駅はどこですか。", exampleTranslation: "Where is the station?", tags: ["Travel"] },
      { front: "切符", back: "Ticket", reading: "きっぷ", romaji: "Kippu", meaning: "Ticket", exampleSentence: "切符を買う。", exampleTranslation: "I buy a ticket.", tags: ["Travel"] },
      { front: "ホテル", back: "Hotel", reading: "ホテル", romaji: "Hoteru", meaning: "Hotel", exampleSentence: "ホテルを予約する。", exampleTranslation: "I book a hotel.", tags: ["Travel"] },
      { front: "両替", back: "Currency exchange", reading: "りょうがえ", romaji: "Ryougae", meaning: "Currency exchange", exampleSentence: "両替はどこですか。", exampleTranslation: "Where can I exchange money?", tags: ["Travel"] },
      { front: "美味しい", back: "Delicious", reading: "おいしい", romaji: "Oishii", meaning: "Delicious", exampleSentence: "これは美味しいです。", exampleTranslation: "This is delicious.", tags: ["Travel", "Food"] },
    ],
  },
  {
    name: "Basic English",
    description: "Everyday English vocabulary for beginners.",
    language: "English",
    cards: [
      { front: "Hello", back: "こんにちは", meaning: "A common greeting", exampleSentence: "Hello, how are you?", exampleTranslation: "こんにちは、お元気ですか。", tags: ["Basic"] },
      { front: "Thank you", back: "ありがとう", meaning: "Expression of gratitude", exampleSentence: "Thank you for your help.", exampleTranslation: "手伝ってくれてありがとう。", tags: ["Basic"] },
      { front: "Friend", back: "友達", meaning: "A person you like and trust", tags: ["Basic"] },
      { front: "Water", back: "水", meaning: "A clear liquid we drink", tags: ["Basic"] },
      { front: "Book", back: "本", meaning: "Pages bound together to read", tags: ["Basic"] },
    ],
  },
];
