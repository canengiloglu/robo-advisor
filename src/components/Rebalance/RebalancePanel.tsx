import { useState } from 'react';
import toast from 'react-hot-toast';
import { usePortfolioStore } from '../../store/portfolioStore';
import { Button } from '../UI/Button';
import { RebalanceResult } from './RebalanceResult';
import { fmtTL } from '../../lib/format';
import { useT } from '../../hooks/useT';

function validate(raw: string, t: ReturnType<typeof useT>): string | null {
  if (raw === '' || raw === null) return t.validAmountRequired;
  const n = parseFloat(raw);
  if (isNaN(n)) return t.onlyNumbers;
  if (n < 0)    return t.amountPositive;
  if (n === 0)  return t.validAmountRequired;
  return null;
}

export function RebalancePanel() {
  const [cash, setCash] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const { runRebalance, applyRebalance, clearResult, lastResult } = usePortfolioStore();
  const t = useT();

  const amount = parseFloat(cash);
  const isValid = !isNaN(amount) && amount > 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCash(e.target.value);
    if (touched && error) setError(validate(e.target.value, t));
  };

  const handleBlur = () => {
    setTouched(true);
    setError(validate(cash, t));
  };

  const handlePreview = () => {
    const err = validate(cash, t);
    if (err) { setError(err); setTouched(true); return; }
    runRebalance(amount);
  };

  const resetForm = () => { setCash(''); setError(null); setTouched(false); };

  const handleApply = () => {
    if (!lastResult) return;
    const newTotal = lastResult.total_after;
    applyRebalance();
    resetForm();
    toast.success(`${t.portfolioUpdated} ${fmtTL(newTotal)}`);
  };

  const handleCancel = () => {
    resetForm();
    clearResult();
  };

  const inputBorderColor = error
    ? 'rgba(239,68,68,0.5)'
    : 'rgba(255,255,255,0.07)';

  return (
    <div>
      <div className="flex flex-col gap-1">
        <label className="ds-label block mb-1.5">{t.cashToAdd}</label>
        <div className="flex flex-col md:flex-row items-start gap-3">
          <div className="flex flex-col w-full md:w-auto">
            {/* Input with ₺ prefix */}
            <div className="relative">
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none select-none"
                style={{ color: '#64748B' }}
              >
                ₺
              </span>
              <input
                type="number"
                placeholder="10.000"
                value={cash}
                min={0}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={(e) => e.key === 'Enter' && !lastResult && handlePreview()}
                className="input-field font-mono w-full md:w-48 rounded-xl py-2 pr-3 text-sm tabular-nums"
                style={{
                  paddingLeft: '30px',
                  borderColor: inputBorderColor,
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = error ? 'rgba(239,68,68,0.5)' : 'rgba(99,102,241,0.4)')}
              />
            </div>
            <p className="text-xs mt-0.5" style={{ minHeight: '1.25rem', color: '#EF4444' }}>
              {error ?? ''}
            </p>
          </div>

          {!lastResult && (
            <Button
              onClick={handlePreview}
              disabled={!isValid}
              className="h-[38px] mt-0 w-full md:w-auto"
            >
              {t.preview}
            </Button>
          )}
        </div>
      </div>

      {/* Yardımcı metin */}
      {!lastResult && !error && (
        <p className="mt-2 text-xs" style={{ color: 'rgba(100,116,139,0.5)' }}>
          {t.algorithmNote}
        </p>
      )}

      {/* Önizleme hazır indicator */}
      {isValid && !lastResult && !error && (
        <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: 'rgba(100,116,139,0.6)' }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#6366F1' }} />
          <span className="font-mono">{fmtTL(amount)} {t.distributionReady}</span>
        </div>
      )}

      {/* Önizleme sonucu */}
      {lastResult && <RebalanceResult result={lastResult} />}

      {/* Aşama 2 butonları */}
      {lastResult && (
        <div className="flex items-center gap-3 mt-5 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Button onClick={handleApply} className="flex items-center gap-2 px-5 py-2.5">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7.5L5.5 11L12 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t.apply}
          </Button>

          <button
            onClick={handleCancel}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 active:scale-[0.98]"
            style={{
              color: '#EF4444',
              border: '1px solid rgba(239,68,68,0.2)',
              background: 'transparent',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.06)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.4)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.2)';
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            {t.cancel}
          </button>
        </div>
      )}
    </div>
  );
}
