const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY as string

export async function saveMemory(data: {
  storyTitle: string
  locationName: string
  countryCode: string
  transcript: string
  bertTokens: any
  totalTokens: number
  positiveTokens: number
  positivePct: number
  negativeTokens: number
  negativePct: number
  neutralTokens: number
  neutralPct: number
}): Promise<string | undefined> {
  // Geocode the location name to coordinates
  let lat = null
  let lng = null
  try {
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(data.locationName)}&format=json&limit=1`,
      { headers: { 'User-Agent': 'diary-of-memories-app' } }
    )
    const geoData = await geoRes.json()
    if (geoData.length > 0) {
      lat = parseFloat(geoData[0].lat)
      lng = parseFloat(geoData[0].lon)
    }
  } catch (err) {
    console.warn('Geocoding failed:', err)
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/memories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      story_title: data.storyTitle,
      location_name: data.locationName,
      country_code: data.countryCode,
      location_lat: lat,
      location_lng: lng,
      transcript: data.transcript,
      bert_tokens: data.bertTokens,
      total_tokens: data.totalTokens,
      positive_tokens: data.positiveTokens,
      positive_pct: data.positivePct,
      negative_tokens: data.negativeTokens,
      negative_pct: data.negativePct,
      neutral_tokens: data.neutralTokens,
      neutral_pct: data.neutralPct
    })
  })

  if (!response.ok) {
    const errText = await response.text()
    console.error('Supabase save failed:', errText)
    return undefined
  }

  const saved = await response.json()
  console.log('Memory saved to Supabase! ID:', saved[0]?.id)
  return saved[0]?.id as string | undefined
}
