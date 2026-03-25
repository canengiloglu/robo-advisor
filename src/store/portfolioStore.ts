import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Asset, RebalanceSummary } from '../lib/rebalance';
import { rebalance } from '../lib/rebalance';
import { syncToSupabase } from '../lib/supabaseSync';

export interface RebalanceRecord {
  id: string;
  date: string;
  cashAdded: number;
  portfolioBeforeTotal: number;
  portfolioAfterTotal: number;
  allocations: {
    symbol: string;
    name: string;
    amount: number;
  }[];
}

export interface StoredAsset extends Asset {
  lastUpdated?: number; // Unix timestamp (ms)
  units?: number | null; // Birim sayısı (otomatik fiyat güncellemesi için)
  unitPrice?: number | null; // Son bilinen birim fiyat (TEFAS'tan)
}

// Gerçek portföy verisi (Mart 2026)
// Not: THYAO+ASELSAN satılıyor; satış nakiti (~8.613 TL) kullanıcı "Eklenecek Nakit" alanına girer
const DEFAULT_ASSETS: StoredAsset[] = [
  { id: '1', symbol: 'TLY',   name: 'Serbest Fon',       target_weight: 0.50,  current_value: 155_072.87 },
  { id: '2', symbol: 'IJC',   name: 'Çip Fonu',           target_weight: 0.125, current_value: 38_096.07 },
  { id: '3', symbol: 'AFT',   name: 'Yabancı Teknoloji',  target_weight: 0.125, current_value: 28_885.85 },
  { id: '4', symbol: 'YJK',   name: 'Yerel Hisse',        target_weight: 0.10,  current_value: 30_979.03 },
  { id: '5', symbol: 'ALTIN', name: 'Altın (Sigorta)',    target_weight: 0.15,  current_value: 0 },
];

interface PortfolioStore {
  assets: StoredAsset[];
  lastResult: RebalanceSummary | null;
  appliedCash: number | null;
  portfolioId: string | null;
  monthlyAdded: number;
  monthlyAddedMonth: string;
  history: RebalanceRecord[];
  lastPriceUpdate: string | null;
  priceUpdateStatus: 'idle' | 'success' | 'partial' | 'failed';

  setLastPriceUpdate: (date: string) => void;
  setPriceUpdateStatus: (status: 'idle' | 'success' | 'partial' | 'failed') => void;
  setAssets: (assets: StoredAsset[]) => void;
  setStoreFromSupabase: (data: { assets: StoredAsset[]; history: RebalanceRecord[]; monthlyAdded: number; monthlyAddedMonth: string; lastPriceUpdate: string | null }) => void;
  updateAssetValue: (id: string, value: number) => void;
  updateAssetUnits: (id: string, units: number | null) => void;
  updateUnitPrice: (id: string, price: number) => void;
  addAsset: (symbol: string, name: string, targetWeight: number, currentValue: number, units?: number | null) => void;
  removeAsset: (id: string) => void;
  updateTargetWeight: (id: string, weight: number) => void;
  runRebalance: (cash: number) => RebalanceSummary;
  applyRebalance: () => void;
  clearResult: () => void;
  setPortfolioId: (id: string) => void;
  resetToDefaults: () => void;
  undoLastRebalance: () => void;
}

export const usePortfolioStore = create<PortfolioStore>()(
  persist(
    (set, get) => ({
      assets: DEFAULT_ASSETS,
      lastResult: null,
      appliedCash: null,
      portfolioId: null,
      monthlyAdded: 0,
      monthlyAddedMonth: new Date().toISOString().slice(0, 7),
      history: [],
      lastPriceUpdate: null,
      priceUpdateStatus: 'idle',

      setLastPriceUpdate: (date) => set({ lastPriceUpdate: date }),
      setPriceUpdateStatus: (status) => set({ priceUpdateStatus: status }),

      setAssets: (assets) => set({ assets }),

      setStoreFromSupabase: (data) => set({
        assets: data.assets,
        history: data.history,
        monthlyAdded: data.monthlyAdded,
        monthlyAddedMonth: data.monthlyAddedMonth,
        lastPriceUpdate: data.lastPriceUpdate,
        lastResult: null,
      }),

      addAsset: (symbol, name, targetWeight, currentValue, units = null) => {
        set((state) => ({
          assets: [
            ...state.assets,
            {
              id: Date.now().toString(),
              symbol: symbol.toUpperCase(),
              name,
              target_weight: targetWeight / 100,
              current_value: currentValue,
              units: units ?? null,
            },
          ],
          lastResult: null,
        }));
        const s = get();
        syncToSupabase({ assets: s.assets, history: s.history, monthlyAdded: s.monthlyAdded, monthlyAddedMonth: s.monthlyAddedMonth, lastPriceUpdate: s.lastPriceUpdate }).catch(console.error);
      },

      removeAsset: (id) => {
        set((state) => ({
          assets: state.assets.filter((a) => a.id !== id),
          lastResult: null,
        }));
        const s = get();
        syncToSupabase({ assets: s.assets, history: s.history, monthlyAdded: s.monthlyAdded, monthlyAddedMonth: s.monthlyAddedMonth, lastPriceUpdate: s.lastPriceUpdate }).catch(console.error);
        import('../lib/supabase').then(({ supabase }) => {
          if (supabase) {
            supabase.from('assets').delete().eq('id', id)
              .then(({ error }) => { if (error) console.error('Asset delete error:', error) });
          }
        });
      },

      updateTargetWeight: (id, weight) => {
        set((state) => ({
          assets: state.assets.map((a) =>
            a.id === id ? { ...a, target_weight: weight } : a
          ),
          lastResult: null,
        }));
        const s = get();
        syncToSupabase({ assets: s.assets, history: s.history, monthlyAdded: s.monthlyAdded, monthlyAddedMonth: s.monthlyAddedMonth, lastPriceUpdate: s.lastPriceUpdate }).catch(console.error);
      },

      updateAssetValue: (id, value) => {
        set((state) => ({
          assets: state.assets.map((a) =>
            a.id === id ? { ...a, current_value: value, lastUpdated: Date.now() } : a
          ),
          lastResult: null,
        }));
        const s = get();
        syncToSupabase({ assets: s.assets, history: s.history, monthlyAdded: s.monthlyAdded, monthlyAddedMonth: s.monthlyAddedMonth, lastPriceUpdate: s.lastPriceUpdate }).catch(console.error);
      },

      updateAssetUnits: (id, units) => {
        set((state) => ({
          assets: state.assets.map((a) =>
            a.id === id ? { ...a, units } : a
          ),
        }));
        const s = get();
        syncToSupabase({ assets: s.assets, history: s.history, monthlyAdded: s.monthlyAdded, monthlyAddedMonth: s.monthlyAddedMonth, lastPriceUpdate: s.lastPriceUpdate }).catch(console.error);
      },

      updateUnitPrice: (id, price) => {
        set((state) => ({
          assets: state.assets.map((a) =>
            a.id === id ? { ...a, unitPrice: price } : a
          ),
        }));
      },

      runRebalance: (cash) => {
        const result = rebalance(get().assets, cash);
        set({ lastResult: result });
        return result;
      },

      applyRebalance: () => {
        const { assets, lastResult, monthlyAdded, monthlyAddedMonth, history } = get();
        if (!lastResult) return;
        const now = Date.now();
        const currentMonth = new Date().toISOString().slice(0, 7);
        const cashAmount = lastResult.cash_added;
        const updated = assets.map((a) => {
          const r = lastResult.results.find((r) => r.symbol === a.symbol);
          return r && r.allocation > 0
            ? { ...a, current_value: Math.round((a.current_value + r.allocation) * 100) / 100, lastUpdated: now }
            : a;
        });
        const record: RebalanceRecord = {
          id: now.toString(),
          date: new Date().toISOString(),
          cashAdded: cashAmount,
          portfolioBeforeTotal: lastResult.total_after - cashAmount,
          portfolioAfterTotal: lastResult.total_after,
          allocations: assets.map((a) => {
            const r = lastResult.results.find((r) => r.symbol === a.symbol);
            return { symbol: a.symbol, name: a.name, amount: r?.allocation ?? 0 };
          }),
        };
        set({
          assets: updated,
          lastResult: null,
          appliedCash: cashAmount,
          monthlyAdded: monthlyAddedMonth === currentMonth ? monthlyAdded + cashAmount : cashAmount,
          monthlyAddedMonth: currentMonth,
          history: [record, ...history],
        });
        const s = get();
        syncToSupabase({ assets: s.assets, history: s.history, monthlyAdded: s.monthlyAdded, monthlyAddedMonth: s.monthlyAddedMonth, lastPriceUpdate: s.lastPriceUpdate }).catch(console.error);
      },

      clearResult: () => set({ lastResult: null }),

      setPortfolioId: (id) => set({ portfolioId: id }),

      resetToDefaults: () => set({ assets: DEFAULT_ASSETS, lastResult: null, appliedCash: null, monthlyAdded: 0, monthlyAddedMonth: new Date().toISOString().slice(0, 7), history: [], priceUpdateStatus: 'idle', lastPriceUpdate: null }),

      undoLastRebalance: () => {
        const { history, assets } = get();
        if (history.length === 0) return;

        const lastRecord = history[0];

        const newAssets = assets.map((asset) => {
          const allocation = lastRecord.allocations.find((a) => a.symbol === asset.symbol);
          const amountToRemove = allocation?.amount ?? 0;
          return {
            ...asset,
            current_value: Math.max(0, asset.current_value - amountToRemove),
          };
        });

        const newHistory = history.slice(1);
        const newMonthlyAdded = Math.max(0, get().monthlyAdded - lastRecord.cashAdded);

        set({ assets: newAssets, history: newHistory, monthlyAdded: newMonthlyAdded });

        const s = get();
        syncToSupabase({ assets: newAssets, history: newHistory, monthlyAdded: newMonthlyAdded, monthlyAddedMonth: s.monthlyAddedMonth, lastPriceUpdate: s.lastPriceUpdate }).catch(console.error);

        import('../lib/supabase').then(({ supabase }) => {
          if (supabase) {
            supabase.from('rebalance_history')
              .delete()
              .eq('id', lastRecord.id)
              .then(({ error }) => {
                if (error) console.error('Undo delete error:', error);
              });
          }
        });
      },
    }),
    {
      name: 'robo-advisor-portfolio',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
