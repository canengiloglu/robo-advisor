import { useEffect, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { usePortfolioStore } from '../store/portfolioStore'
import { getSnapshots, calculatePnL, type SnapshotRow, type PnLResult } from '../lib/snapshotService'
import { useT } from '../hooks/useT'
import { useThemeColors } from '../hooks/useThemeColors'
import { fmtTL } from '../lib/format'
import { Card } from '../components/UI/Card'
import { AppNav } from '../components/UI/AppNav'
import { useSettingsStore } from '../store/settingsStore'
import { Sun, Moon } from 'lucide-react'

type DayRange = 7 | 30 | 90 | 999

function PnLBadge({ amount, percent, label }: { amount: number; percent: number; label: string }) {
  const positive = amount >= 0
  const color = positive ? '#4ADE80' : '#EF4444'
  const bg = positive ? 'rgba(74,222,128,0.06)' : 'rgba(239,68,68,0.06)'
  const border = positive ? 'rgba(74,222,128,0.15)' : 'rgba(239,68,68,0.15)'
  const sign = positive ? '+' : ''
  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-1"
      style={{ background: bg, border: `1px solid ${border}` }}
    >
      <p className="text-xs font-medium" style={{ color: '#64748B' }}>{label}</p>
      <p className="font-mono tabular-nums font-bold text-lg leading-tight" style={{ color }}>
        {sign}{fmtTL(amount)}
      </p>
      <p className="font-mono tabular-nums text-xs" style={{ color, opacity: 0.75 }}>
        {sign}{percent.toFixed(2)}%
      </p>
    </div>
  )
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-xl px-3 py-2 text-xs"
      style={{
        background: 'rgba(10,10,20,0.95)',
        border: '1px solid rgba(99,102,241,0.25)',
        color: '#CBD5E1',
      }}
    >
      <p style={{ color: '#64748B', marginBottom: 2 }}>{label}</p>
      <p className="font-mono font-semibold" style={{ color: '#818CF8' }}>
        {fmtTL(payload[0].value)}
      </p>
    </div>
  )
}

function filterByDays(snapshots: SnapshotRow[], days: DayRange): SnapshotRow[] {
  if (days === 999) return snapshots
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  const cutoffStr = cutoff.toISOString().split('T')[0]
  return snapshots.filter(s => s.date >= cutoffStr)
}

export function Analytics() {
  const { assets } = usePortfolioStore()
  const { theme, toggleTheme } = useSettingsStore()
  const t = useT()
  const c = useThemeColors()
  const total = assets.reduce((sum, a) => sum + a.current_value, 0)

  const [allSnapshots, setAllSnapshots] = useState<SnapshotRow[]>([])
  const [pnl, setPnl] = useState<PnLResult | null>(null)
  const [dayRange, setDayRange] = useState<DayRange>(30)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSnapshots('default', 365).then(snaps => {
      setAllSnapshots(snaps)
      setPnl(calculatePnL(snaps, total, assets))
      setLoading(false)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const visibleSnapshots = filterByDays(allSnapshots, dayRange)

  const chartData = visibleSnapshots.map(s => ({
    date: s.date.slice(5), // MM-DD
    value: s.total_value,
  }))

  // Asset P&L sorted by amount desc
  const sortedAssets = pnl
    ? [...assets]
        .map(a => ({
          ...a,
          pnl: pnl.assetPnL[a.symbol] ?? { amount: 0, percent: 0 },
        }))
        .sort((a, b) => b.pnl.amount - a.pnl.amount)
    : []

  const DAY_RANGES: { key: DayRange; label: string }[] = [
    { key: 7,   label: '7G' },
    { key: 30,  label: '30G' },
    { key: 90,  label: '90G' },
    { key: 999, label: t.allTime },
  ]

  return (
    <div className="min-h-screen" style={{ background: c.bgBase, color: c.textPrimary }}>

      {/* Header */}
      <header
        className="sticky top-0 z-20"
        style={{
          background: c.bgHeader,
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${c.borderSubtle}`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-9 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="relative flex items-center justify-center shrink-0"
              style={{
                width: 30, height: 30,
                borderRadius: 9,
                background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                boxShadow: '0 0 16px rgba(99,102,241,0.35)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 10L5.5 6L8 8.5L12 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="4" r="1.2" fill="white" />
              </svg>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold tracking-tight" style={{ color: c.textPrimary }}>Robo Advisor</span>
            </div>
            <AppNav />
          </div>
          <button
            onClick={toggleTheme}
            className="rounded-lg p-1.5 transition-all duration-150"
            style={{ border: `1px solid ${c.border}`, color: c.textSecondary }}
          >
            {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-9 py-5 md:py-7 space-y-4">

        <h1 className="text-lg font-semibold" style={{ color: c.textPrimary }}>{t.analyticsTitle}</h1>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid #4F46E5', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : pnl === null ? (
          <Card className="p-10 text-center">
            <p className="text-2xl mb-2">📊</p>
            <p style={{ color: c.textSecondary }}>{t.dataAccumulating}</p>
          </Card>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <PnLBadge amount={pnl.total.amount}   percent={pnl.total.percent}   label={`${t.sinceStart} (${pnl.firstDate})`} />
              <PnLBadge amount={pnl.monthly.amount} percent={pnl.monthly.percent} label={t.monthly} />
              <PnLBadge amount={pnl.weekly.amount}  percent={pnl.weekly.percent}  label={t.weekly} />
              <PnLBadge amount={pnl.daily.amount}   percent={pnl.daily.percent}   label={t.daily} />
            </div>

            {/* Chart */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="ds-label">{t.portfolioHistory}</h2>
                <div className="flex items-center gap-1">
                  {DAY_RANGES.map(r => (
                    <button
                      key={r.key}
                      onClick={() => setDayRange(r.key)}
                      className="px-3 py-1 rounded-full text-xs font-medium transition-all duration-150"
                      style={{
                        background: dayRange === r.key ? 'rgba(99,102,241,0.15)' : 'transparent',
                        color: dayRange === r.key ? '#818CF8' : '#64748B',
                        border: `1px solid ${dayRange === r.key ? 'rgba(99,102,241,0.3)' : 'transparent'}`,
                      }}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {chartData.length < 2 ? (
                <div className="flex items-center justify-center py-16">
                  <p className="text-sm" style={{ color: c.textDisabled }}>{t.dataAccumulating}</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
                    <defs>
                      <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#6366F1" />
                        <stop offset="100%" stopColor="#8B5CF6" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: '#64748B' }}
                      axisLine={false}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#64748B' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={v => fmtTL(v)}
                      width={80}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    {chartData.length > 0 && (
                      <ReferenceLine
                        y={chartData[0].value}
                        stroke="rgba(99,102,241,0.2)"
                        strokeDasharray="4 4"
                      />
                    )}
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="url(#lineGrad)"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: '#818CF8', strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* Asset P&L table */}
            <Card className="p-0 overflow-hidden">
              <div className="px-5 py-4 border-b" style={{ borderColor: c.borderSubtle }}>
                <h2 className="ds-label">{t.assetPerformance}</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: c.bgSubtle }}>
                      <th className="text-left px-5 py-2.5 text-xs font-medium" style={{ color: c.textSecondary }}>{t.symbol}</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium" style={{ color: c.textSecondary }}>{t.asset}</th>
                      <th className="text-right px-4 py-2.5 text-xs font-medium" style={{ color: c.textSecondary }}>{t.startValue}</th>
                      <th className="text-right px-4 py-2.5 text-xs font-medium" style={{ color: c.textSecondary }}>{t.currentValue}</th>
                      <th className="text-right px-5 py-2.5 text-xs font-medium" style={{ color: c.textSecondary }}>{t.pnlAmount}</th>
                      <th className="text-right px-5 py-2.5 text-xs font-medium" style={{ color: c.textSecondary }}>{t.pnlPercent}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAssets.map((a, i) => {
                      const positive = a.pnl.amount >= 0
                      const rowBg = a.pnl.amount > 0.5
                        ? 'rgba(74,222,128,0.03)'
                        : a.pnl.amount < -0.5
                        ? 'rgba(239,68,68,0.03)'
                        : 'transparent'
                      const pnlColor = positive ? '#4ADE80' : '#EF4444'
                      const sign = positive ? '+' : ''
                      const firstSnap = allSnapshots[0]
                      const startVal = firstSnap?.assets_data[a.symbol]?.value ?? 0
                      return (
                        <tr
                          key={a.id}
                          style={{
                            background: rowBg,
                            borderTop: i > 0 ? `1px solid ${c.borderVerySubtle}` : 'none',
                          }}
                        >
                          <td className="px-5 py-3 font-mono text-xs font-semibold" style={{ color: '#818CF8' }}>{a.symbol}</td>
                          <td className="px-4 py-3 text-xs" style={{ color: c.textSecondary }}>{a.name}</td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums text-xs" style={{ color: c.textSecondary }}>
                            {fmtTL(startVal)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums text-xs" style={{ color: c.textPrimary }}>
                            {fmtTL(a.current_value)}
                          </td>
                          <td className="px-5 py-3 text-right font-mono tabular-nums text-xs font-semibold" style={{ color: pnlColor }}>
                            {sign}{fmtTL(a.pnl.amount)}
                          </td>
                          <td className="px-5 py-3 text-right font-mono tabular-nums text-xs font-semibold" style={{ color: pnlColor }}>
                            {sign}{a.pnl.percent.toFixed(2)}%
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </main>
    </div>
  )
}
