import type { VercelRequest, VercelResponse } from '@vercel/node'

export const config = { runtime: 'nodejs' }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const codes = (req.query.codes as string) || ''

  if (!codes) {
    return res.status(400).json({ error: 'codes param required' })
  }

  const today = new Date().toLocaleDateString('tr-TR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  })

  const codeList = codes.split(',')
  const results: Record<string, number | null> = {}

  await Promise.all(codeList.map(async (code) => {
    try {
      const url = `https://www.tefas.gov.tr/api/DB/BindHistoryInfo?fontip=YAT&sfonkod=${code.trim()}&bastarih=${today}&bittarih=${today}`
      console.log('Fetching:', url)

      const response = await fetch(url, {
        headers: {
          'Referer': 'https://www.tefas.gov.tr/FonAnaliz.aspx',
          'Origin': 'https://www.tefas.gov.tr',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest'
        }
      })

      const text = await response.text()
      console.log('TEFAS raw response:', text.substring(0, 200))

      const data = JSON.parse(text)
      const price = data?.data?.[0]?.FIYAT ?? null
      results[code.trim()] = price ? parseFloat(price) : null
    } catch (e) {
      console.error('Error fetching', code, e)
      results[code.trim()] = null
    }
  }))

  return res.status(200).json({ data: results, date: today })
}
