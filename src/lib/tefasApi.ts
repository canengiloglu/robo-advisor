export async function fetchFonPrices(codes: string[]): Promise<Record<string, number | null>> {
  try {
    const res = await fetch(`/api/tefas?codes=${codes.join(',')}`)
    const json = await res.json()
    return json.data ?? {}
  } catch {
    return {}
  }
}
