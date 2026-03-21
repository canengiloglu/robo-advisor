import { useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { usePortfolioStore } from '../store/portfolioStore';
import type { RebalanceRecord } from '../store/portfolioStore';
import { useSettingsStore } from '../store/settingsStore';
import { useThemeColors } from '../hooks/useThemeColors';
import { useT } from '../hooks/useT';
import { fmtTL } from '../lib/format';
import { AppNav } from '../components/UI/AppNav';

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

function UndoConfirmDialog({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  const c = useThemeColors();
  const t = useT();
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onCancel}
    >
      <div
        className="rounded-2xl p-6 max-w-sm w-full mx-4 flex flex-col gap-4"
        style={{ background: c.bgCard, border: `1px solid ${c.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm font-medium" style={{ color: c.textPrimary }}>{t.undoConfirmTitle}</p>
        <p className="text-xs" style={{ color: c.textSecondary }}>{t.undoConfirmDesc}</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-medium transition-colors duration-150"
            style={{ background: c.bgSubtle, color: c.textSecondary, border: `1px solid ${c.border}` }}
          >
            {t.undoCancel}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl text-xs font-medium transition-colors duration-150"
            style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)' }}
          >
            {t.undoConfirm}
          </button>
        </div>
      </div>
    </div>
  );
}

function RecordCard({ record, isLatest }: { record: RebalanceRecord; isLatest: boolean }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const undoLastRebalance = usePortfolioStore((s) => s.undoLastRebalance);
  const c = useThemeColors();
  const t = useT();

  const handleUndo = () => {
    undoLastRebalance();
    setShowConfirm(false);
    toast(t.undoSuccess, {
      duration: 3000,
      style: {
        background: '#111118',
        color: '#fbbf24',
        border: '1px solid rgba(251,191,36,0.3)',
        borderRadius: 12,
        fontSize: 13,
      },
    });
  };

  return (
    <div
      style={{
        background: c.bgCardAlt,
        border: `1px solid ${c.border}`,
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      {/* Kart başlığı */}
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${c.borderSubtle}` }}>
        <div>
          <span className="text-sm font-medium" style={{ color: c.textPrimary }}>
            {formatDate(record.date)}
          </span>
          <p className="text-xs mt-0.5 font-mono tabular-nums" style={{ color: c.textDim }}>
            {fmtTL(record.portfolioBeforeTotal)} → {fmtTL(record.portfolioAfterTotal)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isLatest && (
            <button
              onClick={() => setShowConfirm(true)}
              className="text-xs px-2.5 py-1 rounded-lg transition-colors duration-150"
              style={{ color: '#f87171', border: '1px solid rgba(248,113,113,0.3)', background: 'transparent' }}
            >
              {t.undoRebalance}
            </button>
          )}
          <span
            className="font-mono font-semibold text-sm tabular-nums"
            style={{ color: '#4ADE80', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-0.5px' }}
          >
            +{fmtTL(record.cashAdded)}
          </span>
        </div>
      </div>

      {showConfirm && <UndoConfirmDialog onCancel={() => setShowConfirm(false)} onConfirm={handleUndo} />}

      {/* Varlık dağılımları */}
      <div>
        {record.allocations.map((a) => {
          const pct = record.cashAdded > 0 ? (a.amount / record.cashAdded) * 100 : 0;
          const hasAlloc = a.amount > 0;
          return (
            <div
              key={a.symbol}
              className="flex items-center gap-3 px-5 py-2.5"
              style={{ opacity: hasAlloc ? 1 : 0.4 }}
            >
              <span
                className="font-mono text-xs font-semibold shrink-0"
                style={{ color: '#6366F1', width: 44 }}
              >
                {a.symbol}
              </span>
              <span
                className="font-mono text-xs tabular-nums shrink-0 text-right"
                style={{ color: hasAlloc ? '#4ADE80' : c.textDim, width: 88 }}
              >
                {hasAlloc ? `+${fmtTL(a.amount)}` : '—'}
              </span>
              {hasAlloc ? (
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <div
                    className="flex-1 h-[3px] rounded-full overflow-hidden"
                    style={{ background: c.bgSubtle }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: '#6366F1',
                        opacity: 0.85,
                      }}
                    />
                  </div>
                  <span
                    className="text-xs tabular-nums font-mono shrink-0"
                    style={{ color: c.textSecondary, minWidth: 40, textAlign: 'right' }}
                  >
                    %{pct.toFixed(1)}
                  </span>
                </div>
              ) : (
                <div className="flex-1" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
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

export function HistoryPage() {
  const { history } = usePortfolioStore();
  const { theme, language, toggleTheme, toggleLanguage } = useSettingsStore();
  const c = useThemeColors();
  const t = useT();

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
          {/* Sol: Logo + nav */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5 shrink-0">
              <div
                style={{
                  width: 30, height: 30,
                  borderRadius: 9,
                  background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                  boxShadow: '0 0 16px rgba(99,102,241,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 10L5.5 6L8 8.5L12 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="4" r="1.2" fill="white" />
                </svg>
              </div>
              <span className="text-sm font-semibold tracking-tight" style={{ color: c.textPrimary }}>Robo Advisor</span>
            </Link>
            <AppNav />
          </div>

          {/* Sağ: Toggles */}
          <div className="flex items-center gap-2">
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
            <IconBtn onClick={toggleTheme} title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
              {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
            </IconBtn>
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
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-9 py-7">
        {/* Sayfa başlığı */}
        <div className="flex items-center gap-3 mb-6 max-w-3xl mx-auto">
          <h1 className="text-lg font-semibold" style={{ color: c.textPrimary }}>{t.rebalanceHistory}</h1>
          {history.length > 0 && (
            <span
              className="text-xs font-medium px-2.5 py-1 rounded-full"
              style={{
                color: '#818CF8',
                background: 'rgba(99,102,241,0.1)',
                border: '1px solid rgba(99,102,241,0.2)',
              }}
            >
              {history.length} {t.records}
            </span>
          )}
        </div>

        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <p className="text-sm" style={{ color: c.textDim }}>{t.noHistory}</p>
            <Link
              to="/"
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150"
              style={{
                background: 'rgba(99,102,241,0.1)',
                color: '#818CF8',
                border: '1px solid rgba(99,102,241,0.2)',
              }}
            >
              {t.goToDashboard}
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4 max-w-3xl mx-auto">
            {history.map((record, index) => (
              <RecordCard key={record.id} record={record} isLatest={index === 0} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
