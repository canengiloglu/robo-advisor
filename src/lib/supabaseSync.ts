import { supabase } from './supabase'
import type { StoredAsset, RebalanceRecord } from '../store/portfolioStore'

interface SyncState {
  assets: StoredAsset[]
  history: RebalanceRecord[]
  monthlyAdded: number
  monthlyAddedMonth: string
  lastPriceUpdate: string | null
}

export async function syncToSupabase(state: SyncState) {
  if (!supabase) return

  // 1. Önce portfolyo upsert et
  const { error: pError } = await supabase
    .from('portfolios')
    .upsert({
      id: 'default',
      name: 'Ana Portföy',
      monthly_added: state.monthlyAdded,
      monthly_added_month: state.monthlyAddedMonth,
      last_price_update: state.lastPriceUpdate,
      updated_at: new Date().toISOString(),
    })
  if (pError) { console.error('Portfolio sync error:', pError); return }

  // 2. Varlıkları upsert et
  const assetsToSync = state.assets.map((a) => ({
    id: a.id,
    portfolio_id: 'default',
    symbol: a.symbol,
    name: a.name,
    target_weight: a.target_weight,   // StoredAsset snake_case kullanır
    current_value: a.current_value,   // StoredAsset snake_case kullanır
    units: a.units ?? null,
    last_updated: a.lastUpdated
      ? new Date(a.lastUpdated).toISOString()
      : null,
  }))

  const { error: aError } = await supabase
    .from('assets')
    .upsert(assetsToSync)
  if (aError) console.error('Assets sync error:', aError)

  // 3. Geçmişi upsert et
  if (state.history?.length > 0) {
    const historyToSync = state.history.map((h) => ({
      id: h.id,
      portfolio_id: 'default',
      cash_added: h.cashAdded,
      portfolio_before: h.portfolioBeforeTotal,
      portfolio_after: h.portfolioAfterTotal,
      allocations: h.allocations,
      created_at: new Date(h.date).toISOString(),
    }))

    const { error: hError } = await supabase
      .from('rebalance_history')
      .upsert(historyToSync, { onConflict: 'id' })
    if (hError) console.error('History sync error:', hError)
  }
}

export async function loadFromSupabase() {
  if (!supabase) return null

  const { data: portfolio, error: pError } = await supabase
    .from('portfolios')
    .select('*')
    .eq('id', 'default')
    .maybeSingle()

  if (pError || !portfolio) return null

  const { data: assets } = await supabase
    .from('assets')
    .select('*')
    .eq('portfolio_id', 'default')
    .order('created_at')

  const { data: history } = await supabase
    .from('rebalance_history')
    .select('*')
    .eq('portfolio_id', 'default')
    .order('created_at', { ascending: false })

  if (!assets || assets.length === 0) return null

  const mappedAssets: StoredAsset[] = assets.map((a) => ({
    id: a.id,
    symbol: a.symbol,
    name: a.name,
    target_weight: a.target_weight,
    current_value: a.current_value,
    units: a.units ?? null,
    lastUpdated: a.last_updated ? new Date(a.last_updated).getTime() : undefined,
  }))

  const mappedHistory: RebalanceRecord[] = (history ?? []).map((h) => ({
    id: h.id,
    date: h.created_at,
    cashAdded: h.cash_added,
    portfolioBeforeTotal: h.portfolio_before,
    portfolioAfterTotal: h.portfolio_after,
    allocations: h.allocations ?? [],
  }))

  return {
    assets: mappedAssets,
    history: mappedHistory,
    monthlyAdded: portfolio.monthly_added ?? 0,
    monthlyAddedMonth: portfolio.monthly_added_month ?? '',
    lastPriceUpdate: portfolio.last_price_update ?? null,
  }
}
