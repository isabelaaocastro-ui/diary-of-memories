export interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  isQuestion?: boolean;
}

export interface PersonaSession {
  place: string;
  reason: string;
  moment: string;
  visual: string;
  senses: string;
  title: string;
}

export interface BertToken {
  id: number;
  text: string;
  originalWord: string;
  index: number;
  embeddings: number[]; // 64 dimensions selected from the 768 space
}

export interface ActivationStats {
  totalTokens: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  positivePercent: number;
  negativePercent: number;
  neutralPercent: number;
}
