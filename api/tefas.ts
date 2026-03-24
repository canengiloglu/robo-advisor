import type { VercelRequest, VercelResponse } from '@vercel/node'

export const config = { runtime: 'nodejs' }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const codes = (req.query.codes as string) || ''
  if (!codes) {
    return res.status(400).json({ error: 'codes param required' })
  }

  // Basit yaklaşım: her zaman dünü kullan
  // (TEFAS fiyatları akşam açıklanır, gün içinde dünün verisi en günceldir)
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)

  // Hafta sonu kontrolü
  const day = yesterday.getDay()
  if (day === 0) yesterday.setDate(yesterday.getDate() - 2) // Pazar → Cuma
  if (day === 6) yesterday.setDate(yesterday.getDate() - 1) // Cumartesi → Cuma

  const dateStr = yesterday.toISOString().split('T')[0]

  try {
    const url = `https://tefas-api.p.rapidapi.com/api/v1/fund-info/by-date?fundCodes=${codes}&date=${dateStr}&limit=10`

    console.log('Fetching RapidAPI:', url)

    const response = await fetch(url, {
      headers: {
        'x-rapidapi-host': 'tefas-api.p.rapidapi.com',
        'x-rapidapi-key': process.env.RAPIDAPI_KEY || '',
        'Content-Type': 'application/json'
      }
    })

    const json = await response.json()
    console.log('RapidAPI response success:', json.success)

    if (!json.success || !json.data) {
      return res.status(502).json({
        error: 'TEFAS API returned no data',
        date: dateStr
      })
    }

    // { TLY: 4443.16, IJC: 10.86, ... } formatına dönüştür
    const prices: Record<string, number | null> = {}
    for (const item of json.data) {
      prices[item.fundCode] = item.value ?? null
    }

    return res.status(200).json({
      data: prices,
      date: dateStr,
      source: 'rapidapi-tefas',
      fundCount: json.data.length
    })

  } catch (error) {
    console.error('RapidAPI fetch error:', error)
    return res.status(500).json({
      error: 'Failed to fetch prices',
      date: dateStr
    })
  }
}
