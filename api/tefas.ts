import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const codes = (req.query.codes as string) || ''

  if (!codes) {
    return res.status(400).json({ error: 'codes param required' })
  }

  const codeList = codes.split(',').map(c => c.trim())
  const results: Record<string, number | null> = {}

  await Promise.all(codeList.map(async (code) => {
    try {
      const response = await fetch(
        `https://tefas-api.p.rapidapi.com/api/v1/funds/${code}/info`,
        {
          headers: {
            'Content-Type': 'application/json',
            'x-rapidapi-host': 'tefas-api.p.rapidapi.com',
            'x-rapidapi-key': process.env.RAPIDAPI_KEY || ''
          }
        }
      )

      const data = await response.json()
      console.log(`${code} full response:`, JSON.stringify(data).substring(0, 500))

      const price = data?.data?.last_price
      results[code] = price && price > 0 ? price : null
    } catch (e) {
      console.error('Error fetching', code, e)
      results[code] = null
    }
  }))

  const today = new Date().toLocaleDateString('tr-TR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  })

  return res.status(200).json({ data: results, date: today })
}
