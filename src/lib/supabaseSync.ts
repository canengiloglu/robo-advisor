import { supabase } from './supabase'
import type { StoredAsset, RebalanceRecord } from '../store/portfolioStore'

const PORTFOLIO_ID = 'default'

interface SyncState {
  assets: StoredAsset[]
  history: RebalanceRecord[]
  monthlyAdded: number
  monthlyAddedMonth: string
  lastPriceUpdate: string | null
}

export async function syncToSupabase(state: SyncState) {
  if (!supabase) {
    console.warn('Supabase not initialized — skipping sync')
    return
  }

  console.log('Starting sync...')

  const { data: pData, error: pError } = await supabase
    .from('portfolios')
    .upsert({
      id: PORTFOLIO_ID,
      name: 'Ana Portföy',
      monthly_added: state.monthlyAdded,
      monthly_added_month: state.monthlyAddedMonth,
      last_price_update: state.lastPriceUpdate,
      updated_at: new Date().toISOString(),
    })
  console.log('Portfolio sync:', pData, pError)

  const assetsToSync = state.assets.map((a) => ({
    id: a.id,
    portfolio_id: PORTFOLIO_ID,
    symbol: a.symbol,
    name: a.name,
    target_weight: a.target_weight,
    current_value: a.current_value,
    units: a.units ?? null,
    last_updated: a.lastUpdated ?? null,
  }))
  console.log('Assets to sync:', assetsToSync)

  const { data: aData, error: aError } = await supabase
    .from('assets')
    .upsert(assetsToSync)
  console.log('Assets sync:', aData, aError)

  if (state.history.length > 0) {
    const historyToSync = state.history.map((h) => ({
      id: h.id,
      portfolio_id: PORTFOLIO_ID,
      cash_added: h.cashAdded,
      portfolio_before: h.portfolioBeforeTotal,
      portfolio_after: h.portfolioAfterTotal,
      allocations: h.allocations,
      created_at: h.date,
    }))
    console.log('History to sync:', historyToSync)

    const { data: hData, error: hError } = await supabase
      .from('rebalance_history')
      .upsert(historyToSync, { onConflict: 'id' })
    console.log('History sync:', hData, hError)
  }
}

export async function loadFromSupabase() {
  if (!supabase) return null

  console.log('Loading from Supabase...')

  const { data: portfolio, error: pError } = await supabase
    .from('portfolios')
    .select('*')
    .eq('id', PORTFOLIO_ID)
    .single()
  console.log('Portfolio load:', portfolio, pError)

  const { data: assets, error: aError } = await supabase
    .from('assets')
    .select('*')
    .eq('portfolio_id', PORTFOLIO_ID)
    .order('created_at')
  console.log('Assets load:', assets, aError)

  const { data: history, error: hError } = await supabase
    .from('rebalance_history')
    .select('*')
    .eq('portfolio_id', PORTFOLIO_ID)
    .order('created_at', { ascending: false })
  console.log('History load:', history, hError)

  if (!portfolio || !assets || assets.length === 0) {
    console.log('No data found in Supabase, falling back to localStorage')
    return null
  }

  const mappedAssets: StoredAsset[] = assets.map((a) => ({
    id: a.id,
    symbol: a.symbol,
    name: a.name,
    target_weight: a.target_weight,
    current_value: a.current_value,
    units: a.units ?? null,
    lastUpdated: a.last_updated ?? undefined,
  }))

  const mappedHistory: RebalanceRecord[] = (history ?? []).map((h) => ({
    id: h.id,
    date: h.created_at,
    cashAdded: h.cash_added,
    portfolioBeforeTotal: h.portfolio_before,
    portfolioAfterTotal: h.portfolio_after,
    allocations: h.allocations ?? [],
  }))

  console.log('Supabase load complete:', { assets: mappedAssets.length, history: mappedHistory.length })

  return {
    assets: mappedAssets,
    history: mappedHistory,
    monthlyAdded: portfolio.monthly_added ?? 0,
    monthlyAddedMonth: portfolio.monthly_added_month ?? new Date().toISOString().slice(0, 7),
    lastPriceUpdate: portfolio.last_price_update ?? null,
  }
}
