const SUPABASE_URL = "https://tvshvsfnbzhcmnsmntlp.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2c2h2c2ZuYnpoY21uc21udGxwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODA3OTMyOCwiZXhwIjoyMDkzNjU1MzI4fQ.06Lyed0psKQlnQIIQxBiITc86Hnl1sfjKfenP7kZPC4"

export async function saveMemory(data: {
  storyTitle: string
  locationName: string
  transcript: string
  bertTokens: any
  totalTokens: number
  positiveTokens: number
  positivePct: number
  negativeTokens: number
  negativePct: number
  neutralTokens: number
  neutralPct: number
}) {
  // Geocode the location name to coordinates
  let lat = null
  let lng = null
  try {
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(data.locationName)}&format=json&limit=1`,
      { headers: { 'User-Agent': 'map-of-memories-app' } }
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
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      story_title: data.storyTitle,
      location_name: data.locationName,
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
    console.error('Supabase save failed:', await response.text())
  } else {
    console.log('Memory saved to Supabase!')
  }
}

export async function updateMemoryWithBert(data: {
  storyTitle: string
  bertTokens: any
  totalTokens: number
  positiveTokens: number
  positivePct: number
  negativeTokens: number
  negativePct: number
  neutralTokens: number
  neutralPct: number
}) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/memories?story_title=eq.${encodeURIComponent(data.storyTitle)}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        bert_tokens: data.bertTokens,
        total_tokens: data.totalTokens,
        positive_tokens: data.positiveTokens,
        positive_pct: data.positivePct,
        negative_tokens: data.negativeTokens,
        negative_pct: data.negativePct,
        neutral_tokens: data.neutralTokens,
        neutral_pct: data.neutralPct
      })
    }
  )

  if (!response.ok) {
    console.error('BERT update failed:', await response.text())
  } else {
    console.log('BERT data saved to Supabase!')
  }
}