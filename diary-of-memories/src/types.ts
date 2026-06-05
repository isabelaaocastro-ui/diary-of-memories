export interface BertToken {
  id: number
  text: string
  originalWord: string
  index: number
  embeddings: number[]
}

export interface ActivationStats {
  totalTokens: number
  positiveCount: number
  negativeCount: number
  neutralCount: number
  positivePercent: number
  negativePercent: number
  neutralPercent: number
}

export interface Memory {
  id: string
  story_title: string
  location_name: string
  country_code: string
  location_lat: number
  location_lng: number
  transcript: string
  bert_tokens: BertToken[]
  total_tokens: number
  positive_tokens: number
  positive_pct: number
  negative_tokens: number
  negative_pct: number
  neutral_tokens: number
  neutral_pct: number
  created_at: string
}
