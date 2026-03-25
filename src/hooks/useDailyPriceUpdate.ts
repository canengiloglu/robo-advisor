import { useEffect } from 'react'
import { usePortfolioStore } from '../store/portfolioStore'
import { saveDailySnapshot } from '../lib/snapshotService'

export function useDailyPriceUpdate() {
  const { assets, updateAssetPriceData } = usePortfolioStore()

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    const lastUpdate = localStorage.getItem('tefas-last-price-update')

    if (lastUpdate === today) {
      console.log('Fiyatlar bugün zaten güncellendi, skip.')
      return  // ← BU SATIR KRİTİK — fetch'e gitmeden çık
    }

    const fonCodes = assets
      .filter(a => a.units && a.units > 0)
      .map(a => a.symbol)

    if (fonCodes.length === 0) return

    fetch(`/api/tefas?codes=${fonCodes.join(',')}`)
      .then(res => res.json())
      .then(json => {
        if (!json.data) return

        let updatedCount = 0
        assets.forEach(asset => {
          const price = json.data[asset.symbol]
          if (price && asset.units && asset.units > 0) {
            updateAssetPriceData(asset.id, price, price * asset.units)
            updatedCount++
          }
        })

        if (updatedCount > 0) {
          localStorage.setItem('tefas-last-price-update', today)

          // Günlük snapshot kaydet
          const state = usePortfolioStore.getState()
          const snapshotTotal = state.assets.reduce((sum, a) => sum + (a.current_value || 0), 0)
          saveDailySnapshot('default', snapshotTotal, state.assets)
        }
      })
      .catch(err => console.error('Fiyat güncelleme hatası:', err))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}
