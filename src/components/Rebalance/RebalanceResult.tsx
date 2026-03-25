import type { RebalanceSummary } from '../../lib/rebalance';
import { fmtTL, pct } from '../../lib/format';
import { useT } from '../../hooks/useT';
import { useThemeColors } from '../../hooks/useThemeColors';

function fmtUnit(n: number): string {
  return new Intl.NumberFormat('tr-TR').format(n);
}

interface Props {
  result: RebalanceSummary;
}

export function RebalanceResult({ result }: Props) {
  const t = useT();
  const c = useThemeColors();

  const totalRemainder = result.results.reduce((sum, r) => sum + r.remainder, 0);
  const hasUnitData = result.results.some((r) => r.buyableUnits !== null && r.allocation > 0);

  return (
    <div className="space-y-5 mt-6 pt-6" style={{ borderTop: `1px solid ${c.border}` }}>

      {/* Özet Kartları */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl p-4" style={{ background: c.bgSubtle, border: `1px solid ${c.border}` }}>
          <p className="ds-label mb-1.5">{t.previousTotal}</p>
          <p className="font-mono tabular-nums text-base font-semibold" style={{ color: c.textPrimary }}>{fmtTL(result.total_before)}</p>
        </div>

        <div className="rounded-xl p-4" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
          <p className="ds-label mb-1.5">{t.addedCash}</p>
          <p className="font-mono tabular-nums text-base font-semibold" style={{ color: '#818CF8' }}>+{fmtTL(result.cash_added)}</p>
        </div>

        <div className="rounded-xl p-4" style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.15)' }}>
          <p className="ds-label mb-1.5">{t.newTotal}</p>
          <p className="font-mono tabular-nums text-base font-semibold" style={{ color: '#4ADE80' }}>{fmtTL(result.total_after)}</p>
        </div>
      </div>

      {/* Dağıtım Tablosu */}
      <div className="overflow-x-auto rounded-xl" style={{ border: `1px solid ${c.border}` }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: `1px solid ${c.borderSubtle}`, background: c.bgSubtle }}>
              {[t.symbol, t.current, t.target, t.deficit, t.buy, t.newWeight].map((h, i) => (
                <th
                  key={h}
                  className={`py-2.5 px-4 ds-label ${i === 0 ? 'text-left' : 'text-right'}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.results.map((r) => (
              <tr
                key={r.symbol}
                className="transition-all duration-150"
                style={{ borderBottom: `1px solid ${c.borderVerySubtle}` }}
                onMouseEnter={(e) => (e.currentTarget.style.background = c.bgHoverRow)}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <td className="py-3 px-4 font-mono text-sm font-semibold" style={{ color: '#6366F1' }}>{r.symbol}</td>
                <td className="py-3 px-4 text-right tabular-nums font-mono text-xs" style={{ color: c.textSecondary }}>{pct(r.current_weight)}</td>
                <td className="py-3 px-4 text-right tabular-nums font-mono text-xs" style={{ color: c.textSecondary }}>{pct(r.target_weight)}</td>
                <td className="py-3 px-4 text-right tabular-nums font-mono text-xs" style={{ color: c.textDisabled }}>{fmtTL(r.deficit)}</td>

                <td className="py-3 px-4 text-right">
                  {r.allocation > 0 ? (
                    r.buyableUnits !== null && r.buyableUnits > 0 ? (
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="tabular-nums font-mono text-xs" style={{ color: c.textPrimary }}>
                          {fmtUnit(r.buyableUnits)} pay × {fmtTL(r.actualCost / r.buyableUnits)}{' '}
                          <span className="font-semibold" style={{ color: '#4ADE80' }}>= {fmtTL(r.actualCost)}</span>
                        </span>
                        {r.remainder > 0.005 && (
                          <span className="tabular-nums font-mono text-xs" style={{ color: '#F59E0B' }}>
                            Kalan: {fmtTL(r.remainder)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span
                        className="inline-block tabular-nums font-mono text-xs font-semibold px-2.5 py-1 rounded-lg"
                        style={{ color: '#4ADE80', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.15)' }}
                      >
                        +{fmtTL(r.allocation)}
                      </span>
                    )
                  ) : (
                    <span style={{ color: c.textDisabled }}>—</span>
                  )}
                </td>

                <td className="py-3 px-4 text-right tabular-nums font-mono font-medium" style={{ color: c.textPrimary }}>
                  {pct(r.new_weight)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasUnitData && totalRemainder > 0.005 && (
        <div className="flex items-start gap-2.5 rounded-xl px-4 py-3" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.20)' }}>
          <span className="mt-0.5 text-base leading-none" style={{ color: '#F59E0B' }}>⚠</span>
          <p className="text-sm" style={{ color: 'rgba(245,158,11,0.9)' }}>
            {t.roundingRemainder}{' '}
            <span className="font-semibold font-mono tabular-nums">{fmtTL(totalRemainder)}</span>
          </p>
        </div>
      )}

      {result.unallocated > 0.01 && (
        <div className="flex items-start gap-2.5 rounded-xl px-4 py-3" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
          <span className="mt-0.5 text-base leading-none" style={{ color: '#EF4444' }}>⚠</span>
          <p className="text-sm" style={{ color: 'rgba(239,68,68,0.85)' }}>
            {t.unallocatedPrefix}{' '}
            <span className="font-semibold font-mono tabular-nums">{fmtTL(result.unallocated)}</span>{' '}
            {t.allOverweight}
          </p>
        </div>
      )}
    </div>
  );
}
