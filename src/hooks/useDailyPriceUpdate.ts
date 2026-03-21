import { useEffect } from 'react'
import { usePortfolioStore } from '../store/portfolioStore'
import { fetchFonPrices } from '../lib/tefasApi'

export function useDailyPriceUpdate() {
  const { assets, updateAssetValue, lastPriceUpdate, setLastPriceUpdate, setPriceUpdateStatus } = usePortfolioStore()

  useEffect(() => {
    const now = new Date()
    const day = now.getDay()
    if (day === 0 || day === 6) return // Hafta sonu — sessizce atla

    const today = now.toDateString()
    if (lastPriceUpdate === today) return // Bugün zaten güncellendi

    const assetsWithUnits = assets.filter(a => a.units)
    if (assetsWithUnits.length === 0) return // Birim sayısı girilmemiş varlık yok

    const fonCodes = assetsWithUnits.map(a => a.symbol)

    fetchFonPrices(fonCodes).then(prices => {
      let successCount = 0
      assetsWithUnits.forEach(asset => {
        const price = prices[asset.symbol]
        if (price && asset.units) {
          updateAssetValue(asset.id, price * asset.units)
          successCount++
        }
      })

      if (successCount === 0) {
        setPriceUpdateStatus('failed')
      } else if (successCount < assetsWithUnits.length) {
        setPriceUpdateStatus('partial')
        setLastPriceUpdate(today)
      } else {
        setPriceUpdateStatus('success')
        setLastPriceUpdate(today)
      }
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}
