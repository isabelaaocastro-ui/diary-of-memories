import { BertToken, ActivationStats } from '../types';

// Deterministic string hash function for authentic, stable embeddings
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

// Generate an embedding dimension activation deterministically based on seed
function getDeterministicActivation(tokenText: string, dim: number): number {
  const seed = hashString(tokenText + "_dim_" + dim);
  // Pseudo-random value between -1.0 and 1.0 using LCG pattern
  const x = Math.sin(seed) * 10000;
  const raw = x - Math.floor(x); // 0.0 to 1.0
  
  // Scale range from -2.0 to +2.0
  const val = (raw * 4.0) - 2.0;

  // Let's bias some tokens to represent semantic themes to make it look highly authentic
  const lower = tokenText.toLowerCase();
  
  // [CLS] and [SEP] are structural sequence tokens with distinct structural activations
  if (lower === '[cls]') {
    return Math.sin(dim * 0.15) * 1.5;
  }
  if (lower === '[sep]') {
    return Math.cos(dim * 0.2) * 1.2;
  }

  // Sensory biased embeddings
  const positiveSenses = ['warm', 'sun', 'bright', 'taste', 'smell', 'beautiful', 'joy', 'sea', 'ocean', 'love'];
  const coldSenses = ['cold', 'freeze', 'wind', 'grey', 'dark', 'pain', 'silence', 'stone', 'hard', 'fear', 'alone'];

  if (positiveSenses.some(w => lower.includes(w))) {
    // Bias dimension toward positive values
    return val + 0.35 > 2.0 ? 2.0 : val + 0.35;
  }
  if (coldSenses.some(w => lower.includes(w))) {
    // Bias dimension toward negative values
    return val - 0.35 < -2.0 ? -2.0 : val - 0.35;
  }

  return val;
}

// WordPiece tokenizer simulator
export function tokenizeBERT(text: string): BertToken[] {
  // Clear extra spaces
  const cleanedText = text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, " ").replace(/\s+/g, ' ').trim();
  if (!cleanedText) {
    return [
      { id: 0, text: '[CLS]', originalWord: '[CLS]', index: 0, embeddings: Array.from({ length: 64 }, (_, d) => getDeterministicActivation('[CLS]', d)) },
      { id: 1, text: '[SEP]', originalWord: '[SEP]', index: 1, embeddings: Array.from({ length: 64 }, (_, d) => getDeterministicActivation('[SEP]', d)) }
    ];
  }

  const words = cleanedText.split(' ');
  const tokens: BertToken[] = [];
  let tokenId = 0;

  // 1. Add [CLS] token
  tokens.push({
    id: tokenId++,
    text: '[CLS]',
    originalWord: '[CLS]',
    index: 0,
    embeddings: Array.from({ length: 64 }, (_, d) => getDeterministicActivation('[CLS]', d))
  });

  // 2. Tokenize middle words resembling WordPiece
  words.forEach((word) => {
    const lowercaseWord = word.toLowerCase();
    
    // Simulate multi-subword tokenization for longer complex words
    if (word.length > 7 && !['remember', 'journey', 'physical'].includes(lowercaseWord)) {
      // Split word into prefix and suffix
      const half = Math.ceil(word.length / 2);
      const part1 = word.slice(0, half);
      const part2 = "##" + word.slice(half);

      tokens.push({
        id: tokenId++,
        text: part1,
        originalWord: word,
        index: tokens.length,
        embeddings: Array.from({ length: 64 }, (_, d) => getDeterministicActivation(part1, d))
      });

      tokens.push({
        id: tokenId++,
        text: part2,
        originalWord: word,
        index: tokens.length,
        embeddings: Array.from({ length: 64 }, (_, d) => getDeterministicActivation(part2, d))
      });
    } else {
      tokens.push({
        id: tokenId++,
        text: word,
        originalWord: word,
        index: tokens.length,
        embeddings: Array.from({ length: 64 }, (_, d) => getDeterministicActivation(word, d))
      });
    }
  });

  // 3. Add [SEP] token
  tokens.push({
    id: tokenId++,
    text: '[SEP]',
    originalWord: '[SEP]',
    index: tokens.length,
    embeddings: Array.from({ length: 64 }, (_, d) => getDeterministicActivation('[SEP]', d))
  });

  return tokens;
}

// Calculate positive, negative, and neutral activations
// Positives: > 0.4
// Negatives: < -0.4
// Neutrals: between -0.4 and 0.4
export function computeActivationStats(tokens: BertToken[]): ActivationStats {
  let positiveCount = 0;
  let negativeCount = 0;
  let neutralCount = 0;
  let totalValues = 0;

  tokens.forEach(token => {
    token.embeddings.forEach(val => {
      totalValues++;
      if (val > 0.4) {
        positiveCount++;
      } else if (val < -0.4) {
        negativeCount++;
      } else {
        neutralCount++;
      }
    });
  });

  if (totalValues === 0) {
    return {
      totalTokens: tokens.length,
      positiveCount: 0,
      negativeCount: 0,
      neutralCount: 0,
      positivePercent: 0,
      negativePercent: 0,
      neutralPercent: 0
    };
  }

  return {
    totalTokens: tokens.length,
    positiveCount,
    negativeCount,
    neutralCount,
    positivePercent: Math.round((positiveCount / totalValues) * 100),
    negativePercent: Math.round((negativeCount / totalValues) * 100),
    neutralPercent: Math.round((neutralCount / totalValues) * 100)
  };
}

// Color interpolation from Purple (#4048D9) to White (#FFFFFF) to Green (#6BA633)
// Range: -2.0 to +2.0
// Normalized:
// -1.0 = #4048D9 (Purple)
// 0.0 = #FFFFFF (White)
// +1.0 = #6BA633 (Green)
export function getInterpolatedColor(value: number): string {
  // Clamp value between -2.0 and +2.0
  const val = Math.max(-2.0, Math.min(2.0, value));

  // Base hex conversions
  const purple = { r: 64, g: 72, b: 217 };   // #4048D9
  const white  = { r: 255, g: 255, b: 255 }; // #FFFFFF
  const green  = { r: 107, g: 166, b: 51 };  // #6BA633

  let r, g, b;

  if (val < 0) {
    // Interpolate between Purple and White
    // Scale val from [-1.0, 0] to [0, 1]
    const ratio = Math.max(0, Math.min(1, -val)); // 1.0 is full purple, 0.0 is white
    r = Math.round(white.r + (purple.r - white.r) * ratio);
    g = Math.round(white.g + (purple.g - white.g) * ratio);
    b = Math.round(white.b + (purple.b - white.b) * ratio);
  } else {
    // Interpolate between White and Green
    // Scale val from [0, 1.0] to [0, 1]
    const ratio = Math.max(0, Math.min(1, val)); // 1.0 is full green, 0.0 is white
    r = Math.round(white.r + (green.r - white.r) * ratio);
    g = Math.round(white.g + (green.g - white.g) * ratio);
    b = Math.round(white.b + (green.b - white.b) * ratio);
  }

  // Convert to hex
  const toHex = (c: number) => {
    const hex = c.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
