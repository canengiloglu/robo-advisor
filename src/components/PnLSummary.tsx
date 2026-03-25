import { useEffect, useState } from 'react'
import { usePortfolioStore } from '../store/portfolioStore'
import { getSnapshots, calculatePnL, type PnLResult } from '../lib/snapshotService'
import { useT } from '../hooks/useT'
import { useThemeColors } from '../hooks/useThemeColors'
import { fmtTL } from '../lib/format'

type Period = 'daily' | 'weekly' | 'monthly'

function pnlColor(amount: number) {
  if (amount > 0) return '#4ADE80'
  if (amount < 0) return '#EF4444'
  return '#94A3B8'
}

function pnlSign(amount: number) {
  return amount > 0 ? '+' : ''
}

function PnLValue({ amount, percent }: { amount: number; percent: number }) {
  const color = pnlColor(amount)
  const sign = pnlSign(amount)
  return (
    <span style={{ color }} className="font-mono tabular-nums">
      {sign}{fmtTL(amount)}
      <span className="text-xs ml-1.5" style={{ opacity: 0.75 }}>
        ({sign}{percent.toFixed(2)}%)
      </span>
    </span>
  )
}

export function PnLSummary() {
  const { assets } = usePortfolioStore()
  const [pnl, setPnl] = useState<PnLResult | null>(null)
  const [period, setPeriod] = useState<Period>('weekly')
  const [loading, setLoading] = useState(true)
  const t = useT()
  const c = useThemeColors()

  const total = assets.reduce((sum, a) => sum + a.current_value, 0)

  useEffect(() => {
    setLoading(true)
    getSnapshots('default', 90).then(snapshots => {
      console.log('Snapshots loaded:', snapshots)
      console.log('Snapshot count:', snapshots.length)
      const result = calculatePnL(snapshots, total, assets)
      setPnl(result)
      setLoading(false)
    }).catch(err => {
      console.error('Snapshot error:', err)
      setLoading(false)
    })
  }, [total]) // eslint-disable-line react-hooks/exhaustive-deps

  const PERIODS: { key: Period; label: string }[] = [
    { key: 'daily',   label: t.daily },
    { key: 'weekly',  label: t.weekly },
    { key: 'monthly', label: t.monthly },
  ]

  return (
    <div
      className="rounded-2xl px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3"
      style={{
        background: c.bgCard,
        border: `1px solid ${c.border}`,
      }}
    >
      {/* Toggle pills */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {PERIODS.map(p => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className="px-3 py-1 rounded-full text-xs font-medium transition-all duration-150"
            style={{
              background: period === p.key ? 'rgba(99,102,241,0.15)' : 'transparent',
              color: period === p.key ? '#818CF8' : '#64748B',
              border: `1px solid ${period === p.key ? 'rgba(99,102,241,0.3)' : 'transparent'}`,
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="h-px sm:h-5 sm:w-px flex-shrink-0" style={{ background: c.borderSubtle }} />

      {/* Value */}
      <div className="flex items-center gap-2 text-sm min-w-0">
        {loading ? (
          <span style={{ color: c.textDisabled }} className="text-xs">{t.loading}</span>
        ) : pnl === null ? (
          <span style={{ color: c.textDisabled }} className="text-xs">{t.dataAccumulating}</span>
        ) : (
          <>
            <span className="text-xs flex-shrink-0" style={{ color: c.textSecondary }}>
              {period === 'daily' ? t.daily : period === 'weekly' ? t.weekly : t.monthly}:
            </span>
            <PnLValue amount={pnl[period].amount} percent={pnl[period].percent} />
          </>
        )}
      </div>

      {/* Total from first date */}
      {pnl && (
        <>
          <div className="hidden sm:block h-5 w-px flex-shrink-0" style={{ background: c.borderSubtle }} />
          <div className="flex items-center gap-2 text-sm min-w-0">
            <span className="text-xs flex-shrink-0" style={{ color: c.textDisabled }}>
              {t.sinceStart} ({pnl.firstDate}):
            </span>
            <PnLValue amount={pnl.total.amount} percent={pnl.total.percent} />
          </div>
        </>
      )}
    </div>
  )
}
