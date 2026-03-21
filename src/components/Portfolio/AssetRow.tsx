import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { StoredAsset } from '../../store/portfolioStore';
import { fmtTL, formatAge } from '../../lib/format';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useT } from '../../hooks/useT';

export interface WeightStatus {
  type: 'ok' | 'warning' | 'error';
  message: string;
}

export interface WeightEditState {
  isEditing: boolean;
  draft: string;
  status: WeightStatus | null;
  autoFocus: boolean;
  onClick: () => void;
  onChange: (val: string) => void;
  onCommit: () => void;
  onCancel: () => void;
}

interface AssetRowProps {
  asset: StoredAsset;
  onValueChange: (id: string, value: number) => void;
  onUnitsChange: (id: string, units: number | null) => void;
  onRemove: (id: string) => void;
  grid: string;
  isMobile?: boolean;
  weightEdit: WeightEditState;
}

function LastUpdatedBadge({ ts }: { ts?: number }) {
  const c = useThemeColors();
  const t = useT();
  if (!ts) return <span style={{ color: c.textDisabled, fontSize: 10 }}>—</span>;
  const { days, stale } = formatAge(ts);
  const label = days === 0 ? t.today : t.daysAgo(days);
  return (
    <span
      className="inline-flex items-center gap-1 tabular-nums whitespace-nowrap"
      style={{ fontSize: 10, color: stale ? '#FBBF24' : c.textSecondary }}
    >
      {stale
        ? <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 2v3.5l2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.2"/></svg>
        : <span>↻</span>
      }
      {label}
    </span>
  );
}

const WEIGHT_STYLE: Record<WeightStatus['type'], { border: string; color: string }> = {
  error:   { border: 'rgba(239,68,68,0.5)',  color: '#EF4444' },
  warning: { border: 'rgba(251,191,36,0.5)', color: '#FBBF24' },
  ok:      { border: 'rgba(74,222,128,0.4)', color: '#4ADE80' },
};

export function AssetRow({ asset, onValueChange, onUnitsChange, onRemove, grid, isMobile = false, weightEdit }: AssetRowProps) {
  const { isEditing, draft, status, autoFocus, onClick, onChange, onCommit, onCancel } = weightEdit;
  const c = useThemeColors();
  const t = useT();

  const [valueEditing, setValueEditing] = useState(false);
  const [valueDraft, setValueDraft] = useState('');

  const isAutoMode = Boolean(asset.units);

  const handleValueClick = () => {
    if (isAutoMode) return;
    setValueDraft(asset.current_value ? asset.current_value.toFixed(2) : '');
    setValueEditing(true);
  };

  const commitValueEdit = () => {
    const val = parseFloat(valueDraft) || 0;
    onValueChange(asset.id, val);
    setValueEditing(false);
  };

  const handleRemove = () => {
    if (window.confirm(t.deleteConfirm(asset.symbol))) {
      onRemove(asset.id);
    }
  };

  const weightBorder = status
    ? `1px solid ${WEIGHT_STYLE[status.type].border}`
    : `1px solid ${c.border}`;

  return (
    <div
      className="relative grid items-center gap-4 px-4 py-3 rounded-lg transition-all duration-150 group cursor-default"
      style={{ gridTemplateColumns: grid, background: 'transparent' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = c.bgHoverRow)}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Left accent line on hover */}
      <div
        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        style={{ height: '70%', background: 'linear-gradient(180deg, #6366F1, #8B5CF6)' }}
      />

      {/* 1. Sembol */}
      <span className="font-mono text-sm font-semibold tracking-wide" style={{ color: '#6366F1' }}>
        {asset.symbol}
      </span>

      {/* 2. Varlık adı */}
      <span
        className="text-sm whitespace-nowrap truncate transition-colors duration-150"
        style={{ color: c.textSecondary }}
      >
        {asset.name}
      </span>

      {/* 3. Hedef ağırlık */}
      <span className="flex justify-center relative">
        {isEditing ? (
          <>
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={draft}
              autoFocus={autoFocus}
              onChange={(e) => onChange(e.target.value)}
              onBlur={onCommit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur();
                if (e.key === 'Escape') { e.preventDefault(); onCancel(); }
              }}
              className="font-mono w-full text-center text-xs font-medium tabular-nums focus:outline-none transition-all duration-150 rounded-lg px-1 py-0.5"
              style={{
                background: c.bgSubtle,
                border: weightBorder,
                color: c.textPrimary,
              }}
            />
            {status && (
              <span
                className="absolute top-full left-1/2 -translate-x-1/2 mt-0.5 whitespace-nowrap z-10"
                style={{ fontSize: 9, color: WEIGHT_STYLE[status.type].color }}
              >
                {status.message}
              </span>
            )}
          </>
        ) : (
          <span
            onClick={onClick}
            title={t.clickToEdit}
            className="text-xs font-medium cursor-pointer transition-all duration-150 px-2 py-0.5 rounded-lg"
            style={{
              background: 'rgba(99,102,241,0.08)',
              color: '#6366F1',
              border: '1px solid rgba(99,102,241,0.15)',
            }}
          >
            %{(asset.target_weight * 100).toFixed(1)}
          </span>
        )}
      </span>

      {/* 4. Pay adedi — masaüstünde göster */}
      {!isMobile && (
        <input
          type="number"
          value={asset.units ?? ''}
          placeholder="Pay adedi"
          min={0}
          onChange={(e) => onUnitsChange(asset.id, e.target.value ? parseFloat(e.target.value) : null)}
          className="input-field font-mono w-full rounded-lg px-3 py-1.5 text-right text-sm tabular-nums"
        />
      )}

      {/* 5. DEĞER (TL) — inline edit, otomatik modda kilitli */}
      {valueEditing ? (
        <input
          type="number"
          value={valueDraft}
          placeholder="0"
          min={0}
          autoFocus
          onChange={(e) => setValueDraft(e.target.value)}
          onBlur={commitValueEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
            if (e.key === 'Escape') setValueEditing(false);
          }}
          className="input-field font-mono w-full rounded-lg px-3 py-1.5 text-right text-sm tabular-nums"
          style={isMobile ? { maxWidth: 120 } : undefined}
        />
      ) : (
        <span
          onClick={handleValueClick}
          title={isAutoMode ? 'Pay adedi × TEFAS fiyatı ile otomatik güncellenir' : t.clickToEdit}
          className="flex items-center justify-end gap-1.5 font-mono text-right tabular-nums text-sm font-medium rounded-lg px-3 py-1.5 transition-all duration-150"
          style={{
            color: asset.current_value > 0 ? c.textPrimary : c.textDisabled,
            cursor: isAutoMode ? 'default' : 'pointer',
            background: isAutoMode ? 'rgba(99,102,241,0.04)' : 'transparent',
            border: isAutoMode ? `1px solid ${c.borderVerySubtle}` : '1px solid transparent',
          }}
          onMouseEnter={(e) => { if (!isAutoMode) (e.currentTarget as HTMLElement).style.borderColor = c.border; }}
          onMouseLeave={(e) => { if (!isAutoMode) (e.currentTarget as HTMLElement).style.borderColor = 'transparent'; }}
        >
          {asset.current_value > 0 ? fmtTL(asset.current_value) : <span style={{ color: c.textDisabled }}>—</span>}
          {isAutoMode && (
            <span style={{ opacity: 0.5, fontSize: 10 }}>🔒</span>
          )}
        </span>
      )}

      {/* 6. Güncelleme — masaüstünde göster */}
      {!isMobile && (
        <span className="flex justify-end">
          <LastUpdatedBadge ts={asset.lastUpdated} />
        </span>
      )}

      {/* 7. Sil — masaüstünde göster */}
      {!isMobile && (
        <span className="flex justify-center">
          <button
            onClick={handleRemove}
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 p-1 rounded"
            style={{ color: '#EF4444' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#FCA5A5')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#EF4444')}
          >
            <Trash2 size={13} />
          </button>
        </span>
      )}
    </div>
  );
}
