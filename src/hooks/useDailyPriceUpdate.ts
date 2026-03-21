import { useEffect } from 'react'
import { usePortfolioStore } from '../store/portfolioStore'
import { fetchFonPrices } from '../lib/tefasApi'

export function useDailyPriceUpdate() {
  const { assets, updateAssetValue, lastPriceUpdate, setLastPriceUpdate } = usePortfolioStore()

  useEffect(() => {
    const today = new Date().toDateString()
    if (lastPriceUpdate === today) return // Bugün zaten güncellendi

    const fonCodes = assets.map(a => a.symbol)

    fetchFonPrices(fonCodes).then(prices => {
      let updated = false
      assets.forEach(asset => {
        const price = prices[asset.symbol]
        if (price && asset.units) {
          // Birim sayısı varsa: değer = birim * fiyat
          updateAssetValue(asset.id, price * asset.units)
          updated = true
        }
      })
      if (updated) setLastPriceUpdate(today)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}
