import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { usePortfolioStore } from '../store/portfolioStore';
import type { StoredAsset } from '../store/portfolioStore';
import { useSettingsStore } from '../store/settingsStore';
import { useThemeColors } from '../hooks/useThemeColors';
import { useT } from '../hooks/useT';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { AppNav } from '../components/UI/AppNav';
import { PortfolioTable } from '../components/Portfolio/PortfolioTable';
import { AddAssetModal } from '../components/Portfolio/AddAssetModal';
import { RebalancePanel } from '../components/Rebalance/RebalancePanel';
import { AllocationPieChart } from '../components/Charts/AllocationPieChart';
import { fmtTL, formatAge } from '../lib/format'
import { useDailyPriceUpdate } from '../hooks/useDailyPriceUpdate';

function computeHealth(assets: StoredAsset[], total: number): number | null {
  if (total === 0) return null;
  const drift = assets.reduce((sum, a) => {
    const actual = a.current_value / total;
    return sum + Math.abs(actual - a.target_weight);
  }, 0);
  return Math.max(0, Math.round((1 - drift / 2) * 100));
}

function HealthPill({ score }: { score: number }) {
  const t = useT();
  const config =
    score >= 90 ? { color: '#4ADE80', bg: 'rgba(74,222,128,0.08)',  border: 'rgba(74,222,128,0.18)',  label: t.balanced } :
    score >= 70 ? { color: '#FBBF24', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.18)',  label: t.slightDeviation } :
                  { color: '#EF4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.18)',   label: t.rebalancingRequired };

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
        style={{ color: config.color, background: config.bg, border: `1px solid ${config.border}` }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        {config.label}
      </span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, marginLeft: 6, fontSize: 13, color: config.color }}>
        {score}
      </span>
    </span>
  );
}

function PriceStatusBadge({
  status,
  lastUpdated,
}: {
  status: 'idle' | 'success' | 'partial' | 'failed'
  lastUpdated: number | null
}) {
  const t = useT();

  let label: string
  let color: string
  let bg: string
  let border: string

  if (status === 'success') {
    label = t.priceUpdateSuccess
    color = '#4ADE80'; bg = 'rgba(74,222,128,0.08)'; border = 'rgba(74,222,128,0.15)'
  } else if (status === 'partial') {
    label = t.priceUpdatePartial
    color = '#FBBF24'; bg = 'rgba(251,191,36,0.08)'; border = 'rgba(251,191,36,0.25)'
  } else if (status === 'failed') {
    label = t.priceUpdateFailed
    color = '#FBBF24'; bg = 'rgba(251,191,36,0.08)'; border = 'rgba(251,191,36,0.25)'
  } else {
    // idle — API henüz çağrılmadı, lastUpdated'a bak
    if (!lastUpdated) return null
    const { days, stale } = formatAge(lastUpdated)
    if (stale) {
      label = t.pricesStale
      color = '#FBBF24'; bg = 'rgba(251,191,36,0.08)'; border = 'rgba(251,191,36,0.25)'
    } else {
      const relTime = days === 0 ? t.today : t.daysAgo(days)
      label = `↻ ${t.lastUpdateLabel} ${relTime}`
      color = '#818CF8'; bg = 'rgba(99,102,241,0.08)'; border = 'rgba(99,102,241,0.18)'
    }
  }

  return (
    <span
      className="hidden sm:inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium"
      style={{ fontSize: 10, letterSpacing: '0.5px', color, background: bg, border: `1px solid ${border}`, cursor: 'pointer' }}
      title="Tıkla → fiyatları yenile"
      onClick={() => {
        localStorage.removeItem('tefas-last-price-update')
        window.location.reload()
      }}
    >
      {label}
    </span>
  )
}

function lastUpdatedTs(assets: StoredAsset[]): number | null {
  const timestamps = assets.map((a) => a.lastUpdated).filter(Boolean) as number[];
  return timestamps.length === 0 ? null : Math.max(...timestamps);
}

function IconBtn({ onClick, title, children }: { onClick: () => void; title?: string; children: React.ReactNode }) {
  const c = useThemeColors();
  return (
    <button
      onClick={onClick}
      title={title}
      className="rounded-lg p-1.5 transition-all duration-150"
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
      {children}
    </button>
  );
}

export function Dashboard() {
  useDailyPriceUpdate();
  const { assets, resetToDefaults, lastResult, monthlyAdded, monthlyAddedMonth, priceUpdateStatus } = usePortfolioStore();
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    if (priceUpdateStatus === 'failed') {
      setToastVisible(true);
      const timer = setTimeout(() => setToastVisible(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [priceUpdateStatus]);
  const { theme, language, toggleTheme, toggleLanguage } = useSettingsStore();
  const c = useThemeColors();
  const t = useT();
  const total = assets.reduce((sum, a) => sum + a.current_value, 0);
  const lastUpdated = lastUpdatedTs(assets as StoredAsset[]);
  const health = computeHealth(assets as StoredAsset[], total);
  const topAsset = [...assets].sort((a, b) => b.current_value - a.current_value)[0];
  const [addModalOpen, setAddModalOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ background: c.bgBase, color: c.textPrimary }}>

      {/* ── Header ── */}
      <header
        className="sticky top-0 z-20"
        style={{
          background: c.bgHeader,
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${c.borderSubtle}`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-9 h-14 flex items-center justify-between">

          {/* Sol: Logo + başlık + nav */}
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
              {/* Canlı nokta */}
              <span
                className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ring-2"
                style={{ background: '#4ADE80' }}
              >
                <span className="absolute inset-0 rounded-full animate-ping opacity-60" style={{ background: '#4ADE80' }} />
              </span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 10L5.5 6L8 8.5L12 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="4" r="1.2" fill="white" />
              </svg>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold tracking-tight" style={{ color: c.textPrimary }}>Robo Advisor</span>
              <span className="text-xs hidden sm:inline" style={{ color: c.textSecondary }}>{t.subtitle}</span>
            </div>
            <AppNav />
          </div>

          {/* Sağ: Badge + toggles + reset */}
          <div className="flex items-center gap-2">
            <PriceStatusBadge status={priceUpdateStatus} lastUpdated={lastUpdated} />
            <span
              className="inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-3 py-1"
              style={{
                color: '#818CF8',
                background: 'rgba(99,102,241,0.1)',
                border: '1px solid rgba(99,102,241,0.18)',
              }}
            >
              <span className="w-1 h-1 rounded-full bg-current" />
              {t.dcaNoSell}
            </span>

            {/* Tema toggle */}
            <IconBtn onClick={toggleTheme} title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
              {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
            </IconBtn>

            {/* Dil toggle */}
            <button
              onClick={toggleLanguage}
              style={{
                width: 28, height: 28,
                borderRadius: 8,
                background: 'rgba(99,102,241,0.08)',
                border: '1px solid rgba(99,102,241,0.18)',
                color: '#818CF8',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {language === 'tr' ? 'EN' : 'TR'}
            </button>

            {import.meta.env.DEV && (
              <Button variant="ghost" className="hidden md:block text-xs py-1.5 px-3" onClick={resetToDefaults}>
                {t.reset}
              </Button>
            )}

            {import.meta.env.DEV && (
              <button
                onClick={() => {
                  window.location.href = '/onboarding';
                }}
                style={{ fontSize: 10, opacity: 0.3 }}
                className="btn-ghost"
              >
                ↺ OB
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-9 py-5 md:py-7 space-y-3 md:space-y-4">

        {/* ── İstatistik Kartları ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">

          {/* Toplam Portföy */}
          <Card
            className="p-4 card-glow-top"
            style={{ background: c.cardGradient }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.6) 30%, rgba(139,92,246,0.4) 70%, transparent)', borderRadius: '16px 16px 0 0' }} />
            <p className="ds-label mb-3">{t.totalPortfolio}</p>
            <p className="font-mono tabular-nums font-bold leading-none text-2xl md:text-[2rem]" style={{ color: c.textPrimary, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-1.5px' }}>
              {total > 0 ? fmtTL(total) : <span style={{ color: c.textDisabled, fontSize: 22 }}>Veri Yok</span>}
            </p>
            {monthlyAdded > 0 && monthlyAddedMonth === new Date().toISOString().slice(0, 7) && (
              <p className="font-mono tabular-nums text-xs mt-2 flex items-center gap-1" style={{ color: '#4ADE80' }}>
                <span className="text-base leading-none">↑</span>
                <span>+{fmtTL(monthlyAdded)} {t.addedThisMonth}</span>
              </p>
            )}
            {!lastResult && total > 0 && (
              <p className="text-xs mt-2" style={{ color: c.textSecondary }}>{assets.length} {t.assets}</p>
            )}
          </Card>

          {/* En Büyük Pozisyon */}
          <Card className="p-4">
            <p className="ds-label mb-3">{t.biggestPosition}</p>
            {topAsset?.current_value > 0 ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono font-bold text-2xl" style={{ color: '#6366F1' }}>{topAsset.symbol}</span>
                  <span className="font-mono tabular-nums text-lg font-semibold" style={{ color: c.textPrimary, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-1.5px' }}>
                    {fmtTL(topAsset.current_value)}
                  </span>
                </div>
                <p className="font-mono text-xs mt-2 tabular-nums" style={{ color: c.textSecondary }}>
                  %{total > 0 ? ((topAsset.current_value / total) * 100).toFixed(1) : '0'} {t.actual}
                  {' · '}
                  %{(topAsset.target_weight * 100).toFixed(1)} {t.target}
                </p>
              </>
            ) : (
              <p className="text-2xl" style={{ color: c.textDisabled }}>—</p>
            )}
          </Card>

          {/* Portföy Sağlığı */}
          <Card className="p-4">
            <p className="ds-label mb-3">{t.portfolioHealth}</p>
            {health !== null ? (
              <>
                <HealthPill score={health} />
                <div className="mt-3 h-[3px] rounded-full overflow-hidden" style={{ background: c.bgSubtle }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${health}%`,
                      background: health >= 90
                        ? 'linear-gradient(90deg, #4ADE80, #22C55E)'
                        : health >= 70
                        ? 'linear-gradient(90deg, #F59E0B, #FBBF24)'
                        : 'linear-gradient(90deg, #EF4444, #F87171)',
                    }}
                  />
                </div>
              </>
            ) : (
              <p style={{ color: c.textDisabled }}>{t.noData}</p>
            )}
          </Card>
        </div>

        {/* ── Portföy Tablosu + Grafik ── */}
        <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-stretch">
          <div className="flex-1 min-w-0 order-2 md:order-1">
            <Card className="p-0 overflow-hidden h-full">
              <PortfolioTable onAddClick={() => setAddModalOpen(true)} />
            </Card>
          </div>

          <div className="w-full md:w-80 flex-shrink-0 order-1 md:order-2">
            <Card className="p-6 h-full flex flex-col" style={{ overflow: 'hidden' }}>
              <h2 className="ds-label mb-2">{t.distribution}</h2>

              <AllocationPieChart />

              {/* Hedef vs Gerçek mini barlar */}
              {total > 0 && (
                <div className="mt-4 space-y-2.5 flex-1">
                  {assets.map((a) => {
                    const actual = (a.current_value / total) * 100;
                    const target = a.target_weight * 100;
                    const over = actual > target + 1;
                    const fill = over ? '#FBBF24' : '#6366F1';
                    return (
                      <div key={a.id}>
                        <div className="flex justify-between mb-1">
                          <span className="font-mono text-xs" style={{ color: c.textSecondary }}>{a.symbol}</span>
                          <span className="text-xs font-semibold tabular-nums font-mono">
                            <span style={{ color: over ? '#FBBF24' : '#6366F1' }}>
                              %{actual.toFixed(1)}
                            </span>
                            <span style={{ color: c.textDisabled, fontWeight: 400 }}> / </span>
                            <span style={{ color: c.textSecondary, fontWeight: 400 }}>%{target.toFixed(1)}</span>
                          </span>
                        </div>
                        <div className="relative h-[3px] rounded-full overflow-hidden" style={{ background: c.bgSubtle }}>
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(100, (actual / Math.max(target, 0.1)) * 100)}%`,
                              backgroundColor: fill,
                              opacity: 0.85,
                            }}
                          />
                          <div className="absolute right-0 top-0 w-px h-full" style={{ background: c.borderSubtle }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* ── Nakit Ekle & Dengele ── */}
        <Card className="p-6 card-accent-top">
          <div className="flex items-center gap-3 mb-1">
            <h2 className="ds-label">{t.addCash}</h2>
            <div className="flex-1 h-px" style={{ background: c.borderVerySubtle }} />
            <span className="font-mono" style={{ fontSize: 10, color: c.textDisabled }}>{t.noSell}</span>
          </div>
          <p className="text-xs mb-5" style={{ color: c.textSecondary }}>{t.addCashSub}</p>
          <RebalancePanel />
        </Card>

      </main>

      {/* ── Footer ── */}
      <footer className="max-w-7xl mx-auto px-9 pb-8 pt-2">
        <p className="text-center" style={{ fontSize: 11, color: c.textDisabled }}>
          {t.footer}
        </p>
      </footer>

      <AddAssetModal open={addModalOpen} onClose={() => setAddModalOpen(false)} />

      {/* Toast bildirimi */}
      {toastVisible && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg"
          style={{
            background: 'rgba(30,25,10,0.95)',
            border: '1px solid rgba(251,191,36,0.35)',
            color: '#FBBF24',
            fontSize: 13,
            fontWeight: 500,
            backdropFilter: 'blur(12px)',
            whiteSpace: 'nowrap',
          }}
        >
          <span>⚠</span>
          <span>{t.priceUpdateToastMsg}</span>
          <button onClick={() => setToastVisible(false)} style={{ marginLeft: 8, opacity: 0.6, background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 14 }}>✕</button>
        </div>
      )}
    </div>
  );
}
