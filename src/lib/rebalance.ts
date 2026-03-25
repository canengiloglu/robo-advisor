// Çekirdek yeniden dengeleme algoritması
// KURAL: Hiçbir zaman SATIŞ önerilmez. Yalnızca açığı (deficit) olan varlıklara nakit dağıtılır.

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  target_weight: number; // 0..1 arası oran (örn. 0.50)
  current_value: number; // TL cinsinden güncel değer
  unitPrice?: number | null; // birim fiyat (TEFAS'tan)
}

export interface RebalanceResult {
  symbol: string;
  name: string;
  current_value: number;
  ideal_value: number;
  deficit: number;        // idealDeger - mevcutDeger (negatifse 0)
  allocation: number;     // bu varlığa tahsis edilen nakit miktarı
  new_value: number;      // alımdan sonraki değer
  current_weight: number; // mevcut ağırlık (%)
  target_weight: number;  // hedef ağırlık (%)
  new_weight: number;     // alım sonrası ağırlık (%)
  // Pay bazlı hesap (unitPrice varsa dolu, yoksa null)
  buyableUnits: number | null;
  actualCost: number;     // gerçek harcama (yuvarlanmış)
  remainder: number;      // allocation - actualCost (yuvarlanmadan kalan)
}

export interface RebalanceSummary {
  cash_added: number;
  total_before: number;
  total_after: number;
  results: RebalanceResult[];
  unallocated: number; // dağıtılamayan nakit (tüm varlıklar hedefin üzerindeyse)
}

/**
 * Portföy yeniden dengeleme algoritması
 *
 * Adımlar:
 * 1. Yeni Toplam = mevcutToplamDeger + eklenecekNakit
 * 2. İdeal Değer = yeniToplam × hedefAgirlik  (her varlık için)
 * 3. Açık (Deficit) = idealDeger - mevcutDeger  → negatifse 0
 * 4. Dağıtım = Nakit yalnızca açığı > 0 olan varlıklara, açık oranlarıyla dağıtılır
 */
export function rebalance(assets: Asset[], cashToAdd: number): RebalanceSummary {
  if (assets.length === 0 || cashToAdd <= 0) {
    return {
      cash_added: cashToAdd,
      total_before: assets.reduce((sum, a) => sum + a.current_value, 0),
      total_after: assets.reduce((sum, a) => sum + a.current_value, 0) + cashToAdd,
      results: assets.map((a) => ({
        symbol: a.symbol,
        name: a.name,
        current_value: a.current_value,
        ideal_value: a.current_value,
        deficit: 0,
        allocation: 0,
        new_value: a.current_value,
        current_weight: 0,
        target_weight: a.target_weight,
        new_weight: 0,
        buyableUnits: null,
        actualCost: 0,
        remainder: 0,
      })),
      unallocated: cashToAdd,
    };
  }

  // Adım 1: Toplam değerler
  const totalBefore = assets.reduce((sum, a) => sum + a.current_value, 0);
  const newTotal = totalBefore + cashToAdd;

  // Adım 2 & 3: İdeal değer ve açık hesapla
  const deficits = assets.map((a) => {
    const idealValue = newTotal * a.target_weight;
    const deficit = Math.max(0, idealValue - a.current_value);
    return { asset: a, idealValue, deficit };
  });

  // Adım 4: Toplam açık
  const totalDeficit = deficits.reduce((sum, d) => sum + d.deficit, 0);

  // Dağıtılabilecek nakit: cashToAdd ile sınırlı, totalDeficit kadar dağıtılır
  const distributableCash = Math.min(cashToAdd, totalDeficit);
  const unallocated = cashToAdd - distributableCash;

  const results: RebalanceResult[] = deficits.map(({ asset, idealValue, deficit }) => {
    // Orantılı dağıtım: bu varlığın açığı / toplam açık × dağıtılabilir nakit
    const allocation =
      totalDeficit > 0 ? (deficit / totalDeficit) * distributableCash : 0;

    const newValue = asset.current_value + allocation;

    // Pay bazlı hesap: unitPrice varsa tam pay sayısını hesapla
    const up = asset.unitPrice ?? null;
    const buyableUnits = up && up > 0 ? Math.floor(allocation / up) : null;
    const actualCost = buyableUnits !== null && up ? buyableUnits * up : allocation;
    const remainder = allocation - actualCost;

    return {
      symbol: asset.symbol,
      name: asset.name,
      current_value: asset.current_value,
      ideal_value: idealValue,
      deficit,
      allocation,
      new_value: newValue,
      current_weight: totalBefore > 0 ? (asset.current_value / totalBefore) * 100 : 0,
      target_weight: asset.target_weight * 100,
      new_weight: newTotal > 0 ? (newValue / newTotal) * 100 : 0,
      buyableUnits,
      actualCost,
      remainder,
    };
  });

  return {
    cash_added: cashToAdd,
    total_before: totalBefore,
    total_after: newTotal,
    results,
    unallocated,
  };
}
