import { BertToken, ActivationStats } from '../types';

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash;
}

function getDeterministicActivation(tokenText: string, dim: number): number {
  const seed = hashString(tokenText + "_dim_" + dim);
  const x = Math.sin(seed) * 10000;
  const raw = x - Math.floor(x);
  const val = (raw * 4.0) - 2.0;
  const lower = tokenText.toLowerCase();

  if (lower === '[cls]') return Math.sin(dim * 0.15) * 1.5;
  if (lower === '[sep]') return Math.cos(dim * 0.2) * 1.2;

  const positiveSenses = ['warm', 'sun', 'bright', 'taste', 'smell', 'beautiful', 'joy', 'sea', 'ocean', 'love'];
  const coldSenses = ['cold', 'freeze', 'wind', 'grey', 'dark', 'pain', 'silence', 'stone', 'hard', 'fear', 'alone'];

  if (positiveSenses.some(w => lower.includes(w))) return val + 0.35 > 2.0 ? 2.0 : val + 0.35;
  if (coldSenses.some(w => lower.includes(w))) return val - 0.35 < -2.0 ? -2.0 : val - 0.35;
  return val;
}

export function tokenizeBERT(text: string): BertToken[] {
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

  tokens.push({
    id: tokenId++, text: '[CLS]', originalWord: '[CLS]', index: 0,
    embeddings: Array.from({ length: 64 }, (_, d) => getDeterministicActivation('[CLS]', d))
  });

  words.forEach((word) => {
    const lowercaseWord = word.toLowerCase();
    if (word.length > 7 && !['remember', 'journey', 'physical'].includes(lowercaseWord)) {
      const half = Math.ceil(word.length / 2);
      const part1 = word.slice(0, half);
      const part2 = "##" + word.slice(half);
      tokens.push({ id: tokenId++, text: part1, originalWord: word, index: tokens.length, embeddings: Array.from({ length: 64 }, (_, d) => getDeterministicActivation(part1, d)) });
      tokens.push({ id: tokenId++, text: part2, originalWord: word, index: tokens.length, embeddings: Array.from({ length: 64 }, (_, d) => getDeterministicActivation(part2, d)) });
    } else {
      tokens.push({ id: tokenId++, text: word, originalWord: word, index: tokens.length, embeddings: Array.from({ length: 64 }, (_, d) => getDeterministicActivation(word, d)) });
    }
  });

  tokens.push({
    id: tokenId++, text: '[SEP]', originalWord: '[SEP]', index: tokens.length,
    embeddings: Array.from({ length: 64 }, (_, d) => getDeterministicActivation('[SEP]', d))
  });

  return tokens;
}

export function computeActivationStats(tokens: BertToken[]): ActivationStats {
  let positiveCount = 0, negativeCount = 0, neutralCount = 0, totalValues = 0;

  tokens.forEach(token => {
    token.embeddings.forEach(val => {
      totalValues++;
      if (val > 0.4) positiveCount++;
      else if (val < -0.4) negativeCount++;
      else neutralCount++;
    });
  });

  if (totalValues === 0) return { totalTokens: tokens.length, positiveCount: 0, negativeCount: 0, neutralCount: 0, positivePercent: 0, negativePercent: 0, neutralPercent: 0 };

  return {
    totalTokens: tokens.length,
    positiveCount, negativeCount, neutralCount,
    positivePercent: Math.round((positiveCount / totalValues) * 100),
    negativePercent: Math.round((negativeCount / totalValues) * 100),
    neutralPercent: Math.round((neutralCount / totalValues) * 100)
  };
}

export function getInterpolatedColor(value: number): string {
  const val = Math.max(-2.0, Math.min(2.0, value));
  const purple = { r: 64, g: 72, b: 217 };
  const white  = { r: 255, g: 255, b: 255 };
  const green  = { r: 107, g: 166, b: 51 };
  let r, g, b;

  if (val < 0) {
    const ratio = Math.max(0, Math.min(1, -val));
    r = Math.round(white.r + (purple.r - white.r) * ratio);
    g = Math.round(white.g + (purple.g - white.g) * ratio);
    b = Math.round(white.b + (purple.b - white.b) * ratio);
  } else {
    const ratio = Math.max(0, Math.min(1, val));
    r = Math.round(white.r + (green.r - white.r) * ratio);
    g = Math.round(white.g + (green.g - white.g) * ratio);
    b = Math.round(white.b + (green.b - white.b) * ratio);
  }

  const toHex = (c: number) => c.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
