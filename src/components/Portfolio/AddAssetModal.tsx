import { useState } from 'react';
import { usePortfolioStore } from '../../store/portfolioStore';
import { Button } from '../UI/Button';
import { useT } from '../../hooks/useT';
import { useThemeColors } from '../../hooks/useThemeColors';

interface AddAssetModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddAssetModal({ open, onClose }: AddAssetModalProps) {
  const { assets, addAsset } = usePortfolioStore();
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [weight, setWeight] = useState('');
  const [units, setUnits] = useState('');
  const t = useT();
  const c = useThemeColors();

  if (!open) return null;

  const currentTotal = assets.reduce((sum, a) => sum + a.target_weight * 100, 0);
  const newWeight = parseFloat(weight) || 0;
  const newTotal = currentTotal + newWeight;
  const overLimit = newTotal > 100;
  const canAdd = symbol.trim() !== '' && name.trim() !== '' && newWeight > 0 && !overLimit;

  const inputClass = 'input-field w-full rounded-lg px-3 py-2 text-sm';

  const handleAdd = () => {
    if (!canAdd) return;
    addAsset(symbol.trim(), name.trim(), newWeight, 0, parseFloat(units) || null);
    handleClose();
  };

  const handleClose = () => {
    setSymbol('');
    setName('');
    setWeight('');
    setUnits('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        className="w-full max-w-sm mx-4 rounded-2xl p-6 shadow-2xl"
        style={{ background: c.bgCard, border: `1px solid ${c.border}` }}
      >
        <h2 className="text-sm font-semibold mb-5" style={{ color: c.textPrimary }}>{t.addNewAsset}</h2>

        <div className="space-y-3">
          {/* Sembol */}
          <div>
            <label className="ds-label block mb-1.5">{t.symbol}</label>
            <input
              type="text"
              placeholder={t.symbolPlaceholder}
              maxLength={10}
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              className={`${inputClass} font-mono`}
            />
          </div>

          {/* Varlık Adı */}
          <div>
            <label className="ds-label block mb-1.5">{t.assetName}</label>
            <input
              type="text"
              placeholder={t.assetNamePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Hedef Ağırlık */}
          <div>
            <label className="ds-label block mb-1.5">{t.targetWeightPct}</label>
            <input
              type="number"
              placeholder="10"
              min={0}
              max={100}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className={`${inputClass} font-mono tabular-nums`}
            />
          </div>

          {/* Pay Adedi */}
          <div>
            <label className="ds-label block mb-1.5">{t.payAdedi}</label>
            <input
              type="number"
              placeholder="Opsiyonel"
              min={0}
              value={units}
              onChange={(e) => setUnits(e.target.value)}
              className={`${inputClass} font-mono tabular-nums`}
            />
          </div>

          {/* Mevcut toplam bilgisi */}
          <div className="pt-1 text-xs" style={{ color: c.textSecondary }}>
            {t.currentTotal}:{' '}
            <span className="font-mono" style={{ color: c.textPrimary }}>%{currentTotal.toFixed(1)}</span>
            {' — '}
            {t.remaining}:{' '}
            <span className="font-mono" style={{ color: c.textPrimary }}>%{Math.max(0, 100 - currentTotal).toFixed(1)}</span>
          </div>

          {/* Uyarı */}
          <p className="text-xs" style={{ minHeight: '1.1rem', color: '#EF4444' }}>
            {overLimit ? t.overLimitWarning(newTotal) : ''}
          </p>
        </div>

        {/* Butonlar */}
        <div className="flex gap-3 mt-5">
          <Button variant="secondary" onClick={handleClose} className="flex-1">{t.cancel}</Button>
          <Button onClick={handleAdd} disabled={!canAdd} className="flex-1">{t.add}</Button>
        </div>
      </div>
    </div>
  );
}
