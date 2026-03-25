const tr = {
  // Dashboard — stat cards
  totalPortfolio: 'Toplam Portföy',
  biggestPosition: 'En Büyük Pozisyon',
  portfolioHealth: 'Portföy Sağlığı',
  noData: 'Değer girilmedi',
  balanced: 'Dengeli',
  slightDeviation: 'Hafif Sapma',
  rebalancingRequired: 'Dengeleme Gerekli',
  actual: 'gerçek',
  addedThisMonth: 'bu ay eklendi',
  assets: 'varlık',

  // Dashboard — header
  subtitle: 'Portföy Dengeleme',
  dcaNoSell: 'DCA · Satış Yok',
  reset: 'Sıfırla',
  lastUpdateLabel: 'Son güncelleme:',
  today: 'bugün',
  daysAgo: (n: number) => `${n} gün önce`,

  // Dashboard — distribution panel
  distribution: 'Dağılım',

  // Dashboard — cash panel
  addCash: 'Nakit Ekle & Dengele',
  addCashSub: 'Yeni nakdi eksik pozisyonlara dağıt',
  noSell: 'SATIŞ YOK',

  // Dashboard — footer
  footer: 'Bu araç yatırım tavsiyesi niteliği taşımaz. Yalnızca matematiksel portföy dengeleme hesabı yapar.',

  // Navigation
  panel: 'Panel',
  history: 'Geçmiş',

  // History page
  rebalanceHistory: 'Rebalance Geçmişi',
  noHistory: 'Henüz rebalance yapılmadı',
  goToDashboard: "Dashboard'a Git",
  records: 'kayıt',

  // Portfolio table — headers
  currentPortfolio: 'Mevcut Portföy',
  symbol: 'Sembol',
  asset: 'Varlık',
  target: 'Hedef',
  currentValue: 'Güncel Değer (TL)',
  amount: 'Tutar',
  lastUpdate: 'Güncelleme',
  totalValue: 'Toplam Portföy Değeri',

  // Portfolio table — controls
  editWeights: 'Hedef ağırlıkları düzenle',
  cancel: 'İptal',
  save: 'Kaydet',
  clickToEdit: 'Düzenlemek için tıkla',
  deleteConfirm: (symbol: string) => `"${symbol}" varlığını silmek istediğinizden emin misiniz?`,

  // Weight status messages
  weightOk: (total: number) => `Toplam: %${total.toFixed(1)} ✓`,
  weightOver: (total: number, diff: number) => `Toplam: %${total.toFixed(1)} — %${diff.toFixed(1)} fazla`,
  weightShort: (total: number, diff: number) => `Toplam: %${total.toFixed(1)} — %${diff.toFixed(1)} eksik`,

  // Rebalance panel
  cashToAdd: 'Eklenecek Nakit',
  preview: 'Önizle',
  apply: 'Portföye Uygula',
  algorithmNote: 'Algoritma yalnızca eksik pozisyonlara nakit dağıtır. Hiçbir satış önerilmez.',
  distributionReady: 'dağıtılmaya hazır',
  portfolioUpdated: 'Portföy güncellendi — Yeni toplam:',
  validAmountRequired: 'Lütfen geçerli bir tutar girin',
  onlyNumbers: 'Yalnızca sayı girilebilir',
  amountPositive: 'Tutar sıfırdan büyük olmalıdır',

  // Rebalance result
  previousTotal: 'Önceki Toplam',
  addedCash: 'Eklenen Nakit',
  newTotal: 'Yeni Toplam',
  current: 'Mevcut',
  deficit: 'Açık',
  buy: 'Al',
  newWeight: 'Yeni Ağırlık',
  unallocatedPrefix: 'Dağıtılamayan nakit:',
  allOverweight: '— tüm varlıklar hedef ağırlığını aştı.',
  roundingRemainder: 'Dağıtılamayan nakit (yuvarlanma):',

  // Add asset modal
  addNewAsset: 'Yeni Varlık Ekle',
  assetName: 'Varlık Adı',
  targetWeightPct: 'Hedef Ağırlık (%)',
  currentTotal: 'Mevcut toplam',
  remaining: 'Kalan',
  add: 'Ekle',
  symbolPlaceholder: 'ör: GARAN',
  assetNamePlaceholder: 'ör: Garanti Bankası',
  overLimitWarning: (total: number) => `Toplam hedef ağırlık %100'ü aşıyor (%${total.toFixed(1)})`,

  // Price update status
  priceUpdateSuccess: '↻ Fiyatlar güncellendi',
  priceUpdateFailed: '⚠ Fiyat güncellenemedi',
  priceUpdatePartial: '⚠ Bazı fiyatlar güncellenemedi',
  priceUpdateToastMsg: 'Fiyatlar güncellenemedi — borsa kapalı olabilir. Değerleri manuel güncelleyebilirsiniz.',
  pricesStale: '⚠ Fiyatlar eski',

  // Asset fields
  payAdedi: 'Pay Adedi',
  valueTL: 'Değer (TL)',
  autoUpdated: 'Otomatik güncellenir',
  addAsset: 'Varlık Ekle',
  editRowValues: 'Değeri Düzenle',
  deleteAssetTip: 'Varlığı Sil',
  undoRebalance: 'Geri Al',
  undoConfirmTitle: 'Bu rebalance\'ı geri almak istediğinizden emin misiniz?',
  undoConfirmDesc: 'Portföy değerleri eski haline dönecek.',
  undoCancel: 'İptal',
  undoConfirm: 'Geri Al',
  undoSuccess: '↩ Son rebalance geri alındı',
};

const en: typeof tr = {
  totalPortfolio: 'Total Portfolio',
  biggestPosition: 'Biggest Position',
  portfolioHealth: 'Portfolio Health',
  noData: 'No data entered',
  balanced: 'Balanced',
  slightDeviation: 'Slight Deviation',
  rebalancingRequired: 'Rebalancing Required',
  actual: 'actual',
  addedThisMonth: 'added this month',
  assets: 'assets',

  subtitle: 'Portfolio Rebalancing',
  dcaNoSell: 'DCA · No Sell',
  reset: 'Reset',
  lastUpdateLabel: 'Last update:',
  today: 'today',
  daysAgo: (n: number) => n === 1 ? '1 day ago' : `${n} days ago`,

  distribution: 'Distribution',

  addCash: 'Add Cash & Rebalance',
  addCashSub: 'Distribute new cash to underweight positions',
  noSell: 'NO SELL',

  footer: 'This tool is not investment advice. It only performs mathematical portfolio rebalancing.',

  panel: 'Dashboard',
  history: 'History',

  rebalanceHistory: 'Rebalance History',
  noHistory: 'No rebalance records yet',
  goToDashboard: 'Go to Dashboard',
  records: 'records',

  currentPortfolio: 'Current Portfolio',
  symbol: 'Symbol',
  asset: 'Asset',
  target: 'Target',
  currentValue: 'Current Value (₺)',
  amount: 'Amount',
  lastUpdate: 'Last Update',
  totalValue: 'Total Portfolio Value',

  editWeights: 'Edit target weights',
  cancel: 'Cancel',
  save: 'Save',
  clickToEdit: 'Click to edit',
  deleteConfirm: (symbol: string) => `Are you sure you want to delete "${symbol}"?`,

  weightOk: (total: number) => `Total: ${total.toFixed(1)}% ✓`,
  weightOver: (total: number, diff: number) => `Total: ${total.toFixed(1)}% — ${diff.toFixed(1)}% over`,
  weightShort: (total: number, diff: number) => `Total: ${total.toFixed(1)}% — ${diff.toFixed(1)}% short`,

  cashToAdd: 'Cash to Add',
  preview: 'Preview',
  apply: 'Apply to Portfolio',
  algorithmNote: 'Algorithm only distributes cash to deficit positions. No sells ever.',
  distributionReady: 'ready to distribute',
  portfolioUpdated: 'Portfolio updated — New total:',
  validAmountRequired: 'Please enter a valid amount',
  onlyNumbers: 'Numbers only',
  amountPositive: 'Amount must be greater than zero',

  previousTotal: 'Previous Total',
  addedCash: 'Added Cash',
  newTotal: 'New Total',
  current: 'Current',
  deficit: 'Deficit',
  buy: 'Buy',
  newWeight: 'New Weight',
  unallocatedPrefix: 'Unallocated cash:',
  allOverweight: '— all assets exceeded target weight.',
  roundingRemainder: 'Undistributed cash (rounding):',

  addNewAsset: 'Add New Asset',
  assetName: 'Asset Name',
  targetWeightPct: 'Target Weight (%)',
  currentTotal: 'Current total',
  remaining: 'Remaining',
  add: 'Add',
  symbolPlaceholder: 'e.g. GARAN',
  assetNamePlaceholder: 'e.g. Garantibank',
  overLimitWarning: (total: number) => `Total target weight exceeds 100% (${total.toFixed(1)}%)`,

  // Price update status
  priceUpdateSuccess: '↻ Prices updated',
  priceUpdateFailed: '⚠ Price update failed',
  priceUpdatePartial: '⚠ Some prices unavailable',
  priceUpdateToastMsg: 'Prices could not be updated — market may be closed. You can update values manually.',
  pricesStale: '⚠ Prices outdated',

  // Asset fields
  payAdedi: 'Units',
  valueTL: 'Value (₺)',
  autoUpdated: 'Auto updated',
  addAsset: 'Add Asset',
  editRowValues: 'Edit Values',
  deleteAssetTip: 'Delete Asset',
  undoRebalance: 'Undo',
  undoConfirmTitle: 'Are you sure you want to undo this rebalance?',
  undoConfirmDesc: 'Portfolio values will revert to their previous state.',
  undoCancel: 'Cancel',
  undoConfirm: 'Undo',
  undoSuccess: '↩ Last rebalance undone',
};

export const translations = { tr, en };
export type Translations = typeof tr;
