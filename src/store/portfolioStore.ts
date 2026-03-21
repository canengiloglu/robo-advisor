import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Asset, RebalanceSummary } from '../lib/rebalance';
import { rebalance } from '../lib/rebalance';

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

  setAssets: (assets: StoredAsset[]) => void;
  updateAssetValue: (id: string, value: number) => void;
  addAsset: (symbol: string, name: string, targetWeight: number, currentValue: number) => void;
  removeAsset: (id: string) => void;
  updateTargetWeight: (id: string, weight: number) => void;
  runRebalance: (cash: number) => RebalanceSummary;
  applyRebalance: () => void;
  clearResult: () => void;
  setPortfolioId: (id: string) => void;
  resetToDefaults: () => void;
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

      setAssets: (assets) => set({ assets }),

      addAsset: (symbol, name, targetWeight, currentValue) =>
        set((state) => ({
          assets: [
            ...state.assets,
            {
              id: Date.now().toString(),
              symbol: symbol.toUpperCase(),
              name,
              target_weight: targetWeight / 100,
              current_value: currentValue,
            },
          ],
          lastResult: null,
        })),

      removeAsset: (id) =>
        set((state) => ({
          assets: state.assets.filter((a) => a.id !== id),
          lastResult: null,
        })),

      updateTargetWeight: (id, weight) =>
        set((state) => ({
          assets: state.assets.map((a) =>
            a.id === id ? { ...a, target_weight: weight } : a
          ),
          lastResult: null,
        })),

      updateAssetValue: (id, value) =>
        set((state) => ({
          assets: state.assets.map((a) =>
            a.id === id ? { ...a, current_value: value, lastUpdated: Date.now() } : a
          ),
          lastResult: null,
        })),

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
      },

      clearResult: () => set({ lastResult: null }),

      setPortfolioId: (id) => set({ portfolioId: id }),

      resetToDefaults: () => set({ assets: DEFAULT_ASSETS, lastResult: null, appliedCash: null, monthlyAdded: 0, monthlyAddedMonth: new Date().toISOString().slice(0, 7), history: [] }),
    }),
    {
      name: 'robo-advisor-portfolio',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
