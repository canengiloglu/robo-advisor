import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortfolioStore } from '../store/portfolioStore';
import type { StoredAsset } from '../store/portfolioStore';
import { syncToSupabase } from '../lib/supabaseSync';

const STEP_COUNT = 3;

// ── Static dashboard background mockup ──────────────────────────────────────

function DashboardMockup() {
  const bar = (w: string, opacity = 0.4) => (
    <div style={{ height: 8, borderRadius: 4, background: `rgba(99,102,241,${opacity})`, width: w }} />
  );
  const card = (children: React.ReactNode, flex?: number) => (
    <div
      style={{
        background: '#0D1220',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12,
        padding: '12px 14px',
        flex: flex ?? 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {children}
    </div>
  );

  return (
    <div
      style={{
        position: 'absolute', inset: 0,
        padding: '0 40px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          height: 48,
          background: 'rgba(8,11,18,0.9)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          paddingLeft: 8,
          paddingRight: 8,
          flexShrink: 0,
        }}
      >
        <div style={{ width: 24, height: 24, borderRadius: 7, background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', opacity: 0.8 }} />
        {bar('60px', 0.5)}
        {bar('40px', 0.3)}
        <div style={{ flex: 1 }} />
        {bar('50px', 0.2)}
        {bar('24px', 0.2)}
        {bar('24px', 0.2)}
      </div>

      {/* Stat cards row */}
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        {[1, 2, 3].map((i) => card(
          <>
            {bar('40px', 0.25)}
            {bar(i === 1 ? '80px' : i === 2 ? '60px' : '70px', 0.45)}
            {bar('50px', 0.15)}
          </>
        ))}
      </div>

      {/* Table + chart row */}
      <div style={{ display: 'flex', gap: 8, flex: 1, minHeight: 0 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {card(
            <>
              {bar('90px', 0.3)}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                {[0.7, 0.5, 0.6, 0.45, 0.35].map((op, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {bar('30px', op * 0.5)}
                    {bar('60px', op * 0.4)}
                    {bar('40px', op * 0.3)}
                    {bar('50px', op * 0.35)}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <div style={{ width: 200, flexShrink: 0 }}>
          {card(
            <>
              {bar('50px', 0.3)}
              <div
                style={{
                  width: 100, height: 100,
                  borderRadius: '50%',
                  border: '22px solid rgba(99,102,241,0.3)',
                  margin: '8px auto',
                  background: 'transparent',
                  boxShadow: 'inset 0 0 0 22px rgba(124,58,237,0.15)',
                }}
              />
              {[0.5, 0.4, 0.6, 0.35, 0.45].map((op, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {bar('20px', op * 0.5)}
                  {bar('40px', op * 0.4)}
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Cash panel */}
      <div style={{ flexShrink: 0, marginBottom: 16 }}>
        {card(
          <>
            {bar('110px', 0.3)}
            {bar('180px', 0.2)}
            <div style={{ display: 'flex', gap: 8 }}>
              {bar('120px', 0.25)}
              {bar('80px', 0.35)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Step components ──────────────────────────────────────────────────────────

function Step1({ onNext }: { onNext: () => void }) {
  return (
    <>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
        <div
          style={{
            width: 48, height: 48,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
            boxShadow: '0 0 24px rgba(99,102,241,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 14 14" fill="none">
            <path d="M2 10L5.5 6L8 8.5L12 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="4" r="1.2" fill="white" />
          </svg>
        </div>
      </div>

      <h2 style={{ color: '#F8FAFC', fontSize: 16, fontWeight: 700, margin: '0 0 8px', textAlign: 'center' }}>
        Portföyünü birlikte kuralım
      </h2>
      <p style={{ color: '#64748B', fontSize: 13, margin: '0 0 28px', textAlign: 'center', lineHeight: 1.6 }}>
        3 adımda hazır olacaksın
      </p>

      <PrimaryBtn onClick={onNext}>Devam →</PrimaryBtn>
    </>
  );
}

function Step2({
  assets, values, onChange, units, onUnitsChange, onNext, onBack,
}: {
  assets: StoredAsset[];
  values: Record<string, string>;
  onChange: (id: string, val: string) => void;
  units: Record<string, string>;
  onUnitsChange: (id: string, val: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <>
      <h2 style={{ color: '#F8FAFC', fontSize: 15, fontWeight: 700, margin: '0 0 4px' }}>
        Varlık değerleri
      </h2>
      <p style={{ color: '#64748B', fontSize: 12, margin: '0 0 16px', lineHeight: 1.5 }}>
        Gerçek değerlerini gir veya şimdilik 0 bırak
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {assets.map((a) => (
          <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 44, flexShrink: 0 }}>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#6366F1',
                }}
              >
                {a.symbol}
              </span>
            </div>
            <div style={{ flex: 1, fontSize: 11, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {a.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 11, color: '#475569' }}>₺</span>
                <input
                  type="number"
                  min={0}
                  value={values[a.id]}
                  onChange={(e) => onChange(a.id, e.target.value)}
                  placeholder="0"
                  style={{
                    width: 80,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 8,
                    padding: '5px 8px',
                    color: '#F8FAFC',
                    fontSize: 12,
                    fontFamily: "'JetBrains Mono', monospace",
                    outline: 'none',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                />
              </div>
              <input
                type="number"
                min={0}
                value={units[a.id]}
                onChange={(e) => onUnitsChange(a.id, e.target.value)}
                placeholder="Pay adedi"
                title="Pay Adedi (opsiyonel)"
                style={{
                  width: 80,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  padding: '5px 8px',
                  color: '#F8FAFC',
                  fontSize: 12,
                  fontFamily: "'JetBrains Mono', monospace",
                  outline: 'none',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
              />
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
        <GhostBtn onClick={onBack}>← Geri</GhostBtn>
        <PrimaryBtn onClick={onNext}>Devam →</PrimaryBtn>
      </div>
    </>
  );
}

function Step3({
  assets, weights, onChange, totalWeight, weightOk, weightOver, onBack, onFinish,
}: {
  assets: StoredAsset[];
  weights: Record<string, string>;
  onChange: (id: string, val: string) => void;
  totalWeight: number;
  weightOk: boolean;
  weightOver: boolean;
  onBack: () => void;
  onFinish: () => void;
}) {
  return (
    <>
      <h2 style={{ color: '#F8FAFC', fontSize: 15, fontWeight: 700, margin: '0 0 4px' }}>
        Hedef ağırlıklar
      </h2>
      <p style={{ color: '#64748B', fontSize: 12, margin: '0 0 16px' }}>
        Her varlık için hedef yüzde belirle
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {assets.map((a) => (
          <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 44, flexShrink: 0 }}>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#6366F1',
                }}
              >
                {a.symbol}
              </span>
            </div>
            <div style={{ flex: 1, fontSize: 11, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {a.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input
                type="number"
                min={0}
                max={100}
                value={weights[a.id]}
                onChange={(e) => onChange(a.id, e.target.value)}
                placeholder="0"
                style={{
                  width: 60,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  padding: '5px 8px',
                  color: '#F8FAFC',
                  fontSize: 12,
                  fontFamily: "'JetBrains Mono', monospace",
                  outline: 'none',
                  textAlign: 'right',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
              />
              <span style={{ fontSize: 11, color: '#475569' }}>%</span>
            </div>
          </div>
        ))}
      </div>

      {/* Total indicator */}
      <div
        style={{
          marginTop: 14,
          padding: '8px 12px',
          borderRadius: 8,
          background: weightOk
            ? 'rgba(74,222,128,0.07)'
            : weightOver
            ? 'rgba(239,68,68,0.07)'
            : 'rgba(251,191,36,0.07)',
          border: `1px solid ${weightOk ? 'rgba(74,222,128,0.2)' : weightOver ? 'rgba(239,68,68,0.2)' : 'rgba(251,191,36,0.2)'}`,
          fontSize: 12,
          fontFamily: "'JetBrains Mono', monospace",
          color: weightOk ? '#4ADE80' : weightOver ? '#EF4444' : '#FBBF24',
        }}
      >
        Toplam: %{totalWeight.toFixed(1)}
        {weightOk && ' ✓'}
        {weightOver && ` — %${(totalWeight - 100).toFixed(1)} fazla`}
        {!weightOk && !weightOver && ` — %${(100 - totalWeight).toFixed(1)} eksik`}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
        <GhostBtn onClick={onBack}>← Geri</GhostBtn>
        <PrimaryBtn onClick={onFinish} disabled={weightOver}>
          Portföyümü Kur
        </PrimaryBtn>
      </div>
    </>
  );
}

// ── Shared button components ─────────────────────────────────────────────────

function PrimaryBtn({
  onClick, children, disabled,
}: {
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1,
        background: disabled ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg, #4F46E5, #7C3AED)',
        color: disabled ? 'rgba(255,255,255,0.4)' : '#fff',
        border: 'none',
        borderRadius: 10,
        padding: '10px 16px',
        fontSize: 13,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: "'Inter', system-ui, sans-serif",
        transition: 'opacity 0.15s',
      }}
    >
      {children}
    </button>
  );
}

function GhostBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        background: 'rgba(255,255,255,0.04)',
        color: '#64748B',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10,
        padding: '10px 16px',
        fontSize: 13,
        fontWeight: 500,
        cursor: 'pointer',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {children}
    </button>
  );
}

// ── Main SetupPage ────────────────────────────────────────────────────────────

export function SetupPage({ onComplete }: { onComplete?: () => void }) {
  const navigate = useNavigate();
  const { assets, setAssets } = usePortfolioStore();

  const [step, setStep] = useState(1);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(assets.map((a) => [a.id, a.current_value > 0 ? String(a.current_value) : '']))
  );
  const [weights, setWeights] = useState<Record<string, string>>(() =>
    Object.fromEntries(assets.map((a) => [a.id, (a.target_weight * 100).toFixed(1)]))
  );
  const [units, setUnits] = useState<Record<string, string>>(() =>
    Object.fromEntries(assets.map((a) => [a.id, a.units ? String(a.units) : '']))
  );

  const totalWeight = assets.reduce((sum, a) => sum + (parseFloat(weights[a.id]) || 0), 0);
  const weightOk = Math.abs(totalWeight - 100) < 0.05;
  const weightOver = totalWeight > 100.05;

  const handleFinish = async () => {
    const updatedAssets: StoredAsset[] = assets.map((a) => ({
      ...a,
      current_value: parseFloat(values[a.id]) || 0,
      target_weight: (parseFloat(weights[a.id]) || 0) / 100,
      units: parseFloat(units[a.id]) || null,
    }));
    setAssets(updatedAssets);

    const s = usePortfolioStore.getState();
    await syncToSupabase({
      assets: updatedAssets,
      history: s.history,
      monthlyAdded: s.monthlyAdded,
      monthlyAddedMonth: s.monthlyAddedMonth,
      lastPriceUpdate: s.lastPriceUpdate,
    }).catch(console.error);

    console.log('Setup complete, synced to Supabase');
    onComplete?.();
    navigate('/');
  };

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        overflow: 'hidden',
        background: '#05070F',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Static dashboard mockup background */}
      <DashboardMockup />

      {/* Dark overlay with blur */}
      <div
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(5,7,15,0.75)',
          backdropFilter: 'blur(4px)',
          zIndex: 10,
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'absolute', inset: 0,
          zIndex: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px 16px',
        }}
      >
        <div
          style={{
            background: '#0F1420',
            borderRadius: 18,
            maxWidth: 380,
            width: '100%',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Top glow line */}
          <div
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.7), rgba(139,92,246,0.5), transparent)',
            }}
          />

          {/* Step indicator bars */}
          <div style={{ display: 'flex', gap: 4, padding: '20px 24px 0' }}>
            {Array.from({ length: STEP_COUNT }, (_, i) => (
              <div
                key={i}
                style={{
                  flex: 1, height: 2, borderRadius: 1,
                  background: i < step ? '#6366F1' : 'rgba(255,255,255,0.08)',
                  transition: 'background 0.3s ease',
                }}
              />
            ))}
          </div>

          <div style={{ padding: '20px 24px 24px' }}>
            {step === 1 && <Step1 onNext={() => setStep(2)} />}
            {step === 2 && (
              <Step2
                assets={assets}
                values={values}
                onChange={(id, val) => setValues((prev) => ({ ...prev, [id]: val }))}
                units={units}
                onUnitsChange={(id, val) => setUnits((prev) => ({ ...prev, [id]: val }))}
                onNext={() => setStep(3)}
                onBack={() => setStep(1)}
              />
            )}
            {step === 3 && (
              <Step3
                assets={assets}
                weights={weights}
                onChange={(id, val) => setWeights((prev) => ({ ...prev, [id]: val }))}
                totalWeight={totalWeight}
                weightOk={weightOk}
                weightOver={weightOver}
                onBack={() => setStep(2)}
                onFinish={handleFinish}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
