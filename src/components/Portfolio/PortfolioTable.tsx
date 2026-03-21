import { useState, useRef } from 'react';
import { Edit2 } from 'lucide-react';
import { usePortfolioStore } from '../../store/portfolioStore';
import type { StoredAsset } from '../../store/portfolioStore';
import { AssetRow } from './AssetRow';
import type { WeightStatus, WeightEditState } from './AssetRow';
import { fmtTL } from '../../lib/format';
import { useIsMobile } from '../../lib/useIsMobile';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useT } from '../../hooks/useT';

export const PORTFOLIO_GRID        = '60px 1fr 80px 100px 150px 80px 52px';
export const PORTFOLIO_GRID_MOBILE = '48px 1fr 60px 120px';

const STATUS_COLORS: Record<WeightStatus['type'], string> = {
  ok:      '#4ADE80',
  warning: '#FBBF24',
  error:   '#EF4444',
};

function computeTotal(assets: StoredAsset[], drafts: Record<string, string>) {
  return assets.reduce((sum, a) => {
    const v = drafts[a.id];
    return sum + (v !== undefined ? parseFloat(v) || 0 : a.target_weight * 100);
  }, 0);
}

export function PortfolioTable({ onAddClick }: { onAddClick: () => void }) {
  const { assets, updateAssetValue, updateAssetUnits, removeAsset, updateTargetWeight } = usePortfolioStore();
  const total = assets.reduce((sum, a) => sum + a.current_value, 0);
  const isMobile = useIsMobile();
  const grid = isMobile ? PORTFOLIO_GRID_MOBILE : PORTFOLIO_GRID;
  const c = useThemeColors();
  const t = useT();

  const [editingId, setEditingId]   = useState<string | null>(null);
  const [bulkMode, setBulkMode]     = useState(false);
  const [drafts, setDrafts]         = useState<Record<string, string>>({});
  const editCancelledRef            = useRef(false);

  const getWeightStatus = (total: number): WeightStatus => {
    if (Math.abs(total - 100) < 0.05) return { type: 'ok',     message: t.weightOk(total) };
    if (total > 100)                   return { type: 'error',  message: t.weightOver(total, total - 100) };
    return                                    { type: 'warning', message: t.weightShort(total, 100 - total) };
  };

  const startInlineEdit = (id: string, currentWeight: number) => {
    if (bulkMode) return;
    editCancelledRef.current = false;
    setEditingId(id);
    setDrafts({ [id]: (currentWeight * 100).toString() });
  };

  const commitInlineEdit = (id: string) => {
    if (editCancelledRef.current) { editCancelledRef.current = false; return; }
    const val = Math.max(0, Math.min(100, parseFloat(drafts[id]) || 0));
    updateTargetWeight(id, val / 100);
    setEditingId(null);
    setDrafts({});
  };

  const cancelInlineEdit = () => {
    editCancelledRef.current = true;
    setEditingId(null);
    setDrafts({});
  };

  const startBulkEdit = () => {
    const d: Record<string, string> = {};
    assets.forEach(a => { d[a.id] = (a.target_weight * 100).toString(); });
    setDrafts(d);
    setBulkMode(true);
    setEditingId(null);
  };

  const commitBulkEdit = () => {
    assets.forEach(a => {
      const val = Math.max(0, Math.min(100, parseFloat(drafts[a.id]) || 0));
      updateTargetWeight(a.id, val / 100);
    });
    setBulkMode(false);
    setDrafts({});
  };

  const cancelBulkEdit = () => {
    setBulkMode(false);
    setDrafts({});
  };

  const activeStatus = (editingId || bulkMode) ? getWeightStatus(computeTotal(assets, drafts)) : null;
  const inlineStatus = editingId ? activeStatus : null;
  const bulkStatus   = bulkMode  ? activeStatus : null;

  const HEADERS = [
    { label: t.symbol,      align: 'left',   hideOnMobile: false },
    { label: t.asset,       align: 'left',   hideOnMobile: false },
    { label: t.target,      align: 'center', hideOnMobile: false },
    { label: t.payAdedi,    align: 'right',  hideOnMobile: true  },
    { label: t.valueTL,     align: 'right',  hideOnMobile: false },
    { label: t.lastUpdate,  align: 'right',  hideOnMobile: true  },
    { label: '',            align: 'left',   hideOnMobile: true  },
  ];

  return (
    <div className="pb-0">
      {/* Card header */}
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: `1px solid ${c.borderSubtle}` }}
      >
        <h2 className="ds-label">{t.currentPortfolio}</h2>
        <div className="flex items-center gap-2">
          <span className="font-mono tabular-nums text-xs" style={{ color: c.textSecondary }}>
            {total > 0 ? fmtTL(total) : '—'}
          </span>
          <button
            onClick={startBulkEdit}
            disabled={bulkMode}
            title={t.editWeights}
            className="rounded-lg p-1.5 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ border: `1px solid ${c.border}`, color: c.textSecondary }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = c.textPrimary;
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(99,102,241,0.25)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = c.textSecondary;
              (e.currentTarget as HTMLButtonElement).style.borderColor = c.border;
            }}
          >
            <Edit2 size={13} />
          </button>
          <button
            onClick={onAddClick}
            className="rounded-lg px-3 py-1 text-sm transition-all duration-150"
            style={{
              border: '1px solid rgba(99,102,241,0.3)',
              color: '#818CF8',
              background: 'rgba(99,102,241,0.06)',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.12)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.06)')}
          >
            +
          </button>
        </div>
      </div>

      {/* Column headers */}
      <div
        className="grid items-center gap-4 px-4 py-2.5"
        style={{
          gridTemplateColumns: grid,
          background: c.bgSubtle,
          borderBottom: `1px solid ${c.borderVerySubtle}`,
        }}
      >
        {HEADERS.filter((h) => !isMobile || !h.hideOnMobile).map((h, i) => (
          <span
            key={i}
            className="ds-label"
            style={{ textAlign: h.align as React.CSSProperties['textAlign'] }}
          >
            {h.label}
          </span>
        ))}
      </div>

      {/* Rows */}
      {assets.map((asset) => {
        const isEditing = bulkMode || editingId === asset.id;
        const draft     = drafts[asset.id] ?? (asset.target_weight * 100).toString();
        const status    = (editingId === asset.id && !bulkMode) ? inlineStatus : null;
        const weightEdit: WeightEditState = {
          isEditing,
          draft,
          status,
          autoFocus: editingId === asset.id && !bulkMode,
          onClick:   () => startInlineEdit(asset.id, asset.target_weight),
          onChange:  (val) => setDrafts(prev => ({ ...prev, [asset.id]: val })),
          onCommit:  bulkMode ? () => {} : () => commitInlineEdit(asset.id),
          onCancel:  bulkMode ? () => {} : cancelInlineEdit,
        };
        return (
          <AssetRow
            key={asset.id}
            asset={asset}
            onValueChange={updateAssetValue}
            onUnitsChange={updateAssetUnits}
            onRemove={removeAsset}
            grid={grid}
            isMobile={isMobile}
            weightEdit={weightEdit}
          />
        );
      })}

      {/* Bulk edit controls */}
      {bulkMode && (
        <div
          className="px-4 py-3 flex items-center gap-4"
          style={{ borderTop: `1px solid ${c.borderSubtle}` }}
        >
          {bulkStatus && (
            <span className="font-mono text-xs font-medium tabular-nums" style={{ color: STATUS_COLORS[bulkStatus.type] }}>
              {bulkStatus.message}
            </span>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={cancelBulkEdit}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
              style={{ color: c.textSecondary, border: `1px solid ${c.border}`, background: 'transparent' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = c.bgHoverRow)}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
            >
              {t.cancel}
            </button>
            <button
              onClick={commitBulkEdit}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all duration-150"
              style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}
            >
              {t.save}
            </button>
          </div>
        </div>
      )}

      {/* Value footer */}
      <div
        className="grid items-center gap-4"
        style={{
          gridTemplateColumns: grid,
          padding: '16px 24px',
          background: c.bgSubtle,
          borderTop: `1px solid ${c.borderSubtle}`,
        }}
      >
        <span className="col-span-3" style={{ fontSize: 13, color: c.textDim }}>{t.totalValue}</span>
        {!isMobile && <span />}
        <span className="text-right tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, color: c.textPrimary, fontWeight: 600, letterSpacing: '-0.5px' }}>
          {total > 0 ? fmtTL(total) : <span style={{ color: c.textDisabled }}>—</span>}
        </span>
        {!isMobile && <span />}
        {!isMobile && <span />}
      </div>
    </div>
  );
}
