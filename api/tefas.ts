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

  const now = new Date()
  // UTC'yi Türkiye saatine çevir
  const trNow = new Date(now.getTime() + 3 * 60 * 60 * 1000)
  const trToday = new Date(trNow)
  trToday.setHours(0, 0, 0, 0)

  // Hafta sonu kontrolü (bugün için)
  let targetDate = new Date(trToday)
  const dayOfWeek = targetDate.getDay()
  if (dayOfWeek === 0) targetDate.setDate(targetDate.getDate() - 2)
  else if (dayOfWeek === 6) targetDate.setDate(targetDate.getDate() - 1)

  // Haftaiçi ise bugünün tarihini kullan
  const dateStr = targetDate.toISOString().split('T')[0]

  try {
    const url = `https://tefas-api.p.rapidapi.com/api/v1/fund-info/by-date?fundCodes=${codes}&date=${dateStr}&limit=10`

    console.log('Fetching RapidAPI:', url)
    console.log('RAPIDAPI_KEY exists:', !!process.env.RAPIDAPI_KEY)
    console.log('RAPIDAPI_KEY length:', process.env.RAPIDAPI_KEY?.length || 0)

    const response = await fetch(url, {
      headers: {
        'x-rapidapi-host': 'tefas-api.p.rapidapi.com',
        'x-rapidapi-key': process.env.RAPIDAPI_KEY || '',
        'Content-Type': 'application/json'
      }
    })

    const responseText = await response.text()
    console.log('Raw API response:', responseText.substring(0, 300))

    // Sonra parse et
    const json = JSON.parse(responseText)
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
