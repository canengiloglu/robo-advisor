import { supabase } from './supabase'

export interface SnapshotRow {
  date: string
  total_value: number
  assets_data: Record<string, { value: number; unit_price: number | null; units: number | null }>
}

// Günlük snapshot kaydet
export async function saveDailySnapshot(
  portfolioId: string,
  totalValue: number,
  assets: Array<{ symbol: string; current_value: number; unit_price?: number | null; units?: number | null }>
) {
  if (!supabase) return
  const today = new Date().toISOString().split('T')[0]

  const assetsData: Record<string, { value: number; unit_price: number | null; units: number | null }> = {}
  assets.forEach(a => {
    assetsData[a.symbol] = {
      value: a.current_value,
      unit_price: a.unit_price ?? null,
      units: a.units ?? null,
    }
  })

  const { error } = await supabase
    .from('portfolio_snapshots')
    .upsert(
      {
        portfolio_id: portfolioId,
        date: today,
        total_value: totalValue,
        assets_data: assetsData,
      },
      { onConflict: 'portfolio_id,date' }
    )

  if (error) console.error('Snapshot kayıt hatası:', error)
}

// Snapshot geçmişini çek
export async function getSnapshots(
  portfolioId: string,
  days: number = 90
): Promise<SnapshotRow[]> {
  if (!supabase) return []
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data, error } = await supabase
    .from('portfolio_snapshots')
    .select('date, total_value, assets_data')
    .eq('portfolio_id', portfolioId)
    .gte('date', startDate.toISOString().split('T')[0])
    .order('date', { ascending: true })

  if (error) {
    console.error('Snapshot çekme hatası:', error)
    return []
  }
  return (data as SnapshotRow[]) || []
}

export interface PnLStat {
  amount: number
  percent: number
}

export interface PnLResult {
  daily: PnLStat
  weekly: PnLStat
  monthly: PnLStat
  total: PnLStat
  assetPnL: Record<string, PnLStat>
  snapshotCount: number
  firstDate: string
}

// Kar/zarar hesapla
export function calculatePnL(
  snapshots: SnapshotRow[],
  currentTotal: number,
  currentAssets: Array<{ symbol: string; current_value: number }>
): PnLResult | null {
  if (snapshots.length === 0) return null

  const todayStr = new Date().toISOString().split('T')[0]

  const first = snapshots[0]

  // Dünkü snapshot (bugünkü değilse son entry)
  const lastSnap = snapshots[snapshots.length - 1]
  const yesterday =
    lastSnap?.date !== todayStr ? lastSnap : snapshots[snapshots.length - 2]

  // 7 gün önceki snapshot
  const weekAgoDate = new Date()
  weekAgoDate.setDate(weekAgoDate.getDate() - 7)
  const weekAgo =
    snapshots.find(s => s.date >= weekAgoDate.toISOString().split('T')[0]) || first

  // 30 gün önceki snapshot
  const monthAgoDate = new Date()
  monthAgoDate.setDate(monthAgoDate.getDate() - 30)
  const monthAgo =
    snapshots.find(s => s.date >= monthAgoDate.toISOString().split('T')[0]) || first

  const calc = (ref: SnapshotRow | undefined): PnLStat => {
    if (!ref) return { amount: 0, percent: 0 }
    const amount = Math.round((currentTotal - ref.total_value) * 100) / 100
    const percent =
      ref.total_value > 0
        ? Math.round((amount / ref.total_value) * 10000) / 100
        : 0
    return { amount, percent }
  }

  // Fon bazında kar/zarar (ilk snapshot'a göre)
  const assetPnL: Record<string, PnLStat> = {}
  currentAssets.forEach(a => {
    const firstVal = first.assets_data[a.symbol]?.value || 0
    const diff = a.current_value - firstVal
    assetPnL[a.symbol] = {
      amount: Math.round(diff * 100) / 100,
      percent: firstVal > 0 ? Math.round((diff / firstVal) * 10000) / 100 : 0,
    }
  })

  return {
    daily: yesterday ? calc(yesterday) : { amount: 0, percent: 0 },
    weekly: calc(weekAgo),
    monthly: calc(monthAgo),
    total: calc(first),
    assetPnL,
    snapshotCount: snapshots.length,
    firstDate: first.date,
  }
}
