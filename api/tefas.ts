export const config = { runtime: 'edge' }

export default async function handler(req: Request) {
  const url = new URL(req.url)
  const codes = url.searchParams.get('codes') // "TLY,IJC,AFT,YJK,KZL"

  if (!codes) {
    return new Response(JSON.stringify({ error: 'codes param required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const today = new Date().toLocaleDateString('tr-TR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  }).replace(/\./g, '.')

  const codeList = codes.split(',')
  const results: Record<string, number | null> = {}

  await Promise.all(codeList.map(async (code) => {
    try {
      const res = await fetch(
        `https://www.tefas.gov.tr/api/DB/BindHistoryInfo?fontip=YAT&sfonkod=${code.trim()}&bastarih=${today}&bittarih=${today}`,
        {
          headers: {
            'Referer': 'https://www.tefas.gov.tr/FonAnaliz.aspx',
            'Origin': 'https://www.tefas.gov.tr',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'X-Requested-With': 'XMLHttpRequest'
          }
        }
      )
      const text = await res.text()
      console.log('TEFAS response:', text)
      const data = JSON.parse(text)
      const price = data?.data?.[0]?.FIYAT ?? null
      results[code.trim()] = price ? parseFloat(price) : null
    } catch {
      results[code.trim()] = null
    }
  }))

  return new Response(JSON.stringify({ data: results, date: today }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 's-maxage=3600'
    }
  })
}
