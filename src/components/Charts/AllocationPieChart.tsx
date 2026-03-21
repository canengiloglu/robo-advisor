import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { CSSProperties } from 'react';
import { usePortfolioStore } from '../../store/portfolioStore';
import { fmtTL } from '../../lib/format';

const COLORS = ['#4F46E5', '#7C3AED', '#0891B2', '#059669', '#D97706'];

export function AllocationPieChart() {
  const { assets } = usePortfolioStore();

  const total = assets.reduce((s, a) => s + a.current_value, 0);

  const data = assets
    .filter((a) => a.current_value > 0)
    .map((a) => ({
      name: a.symbol,
      value: total > 0 ? parseFloat(((a.current_value / total) * 100).toFixed(2)) : 0,
    }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-sm" style={{ color: 'rgba(100,116,139,0.4)' }}>
        Değer girilmemiş
      </div>
    );
  }

  const centerStyle: CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center',
    pointerEvents: 'none',
  };

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={52}
            outerRadius={72}
            dataKey="value"
            paddingAngle={2}
            strokeWidth={0}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
            ))}
          </Pie>

          <Tooltip
            formatter={(v) => [`%${v}`, 'Ağırlık']}
            contentStyle={{
              background: '#0F1420',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12,
              fontSize: 12,
              fontFamily: "'JetBrains Mono', monospace",
            }}
            labelStyle={{ color: '#F8FAFC', fontWeight: 600 }}
            itemStyle={{ color: '#64748B' }}
            cursor={false}
          />
        </PieChart>
      </ResponsiveContainer>

      {total > 0 && (
        <div style={centerStyle}>
          <span className="ds-label">Toplam</span>
          <span className="font-mono tabular-nums text-sm font-bold mt-1 leading-tight block" style={{ color: 'var(--text-primary)' }}>
            {fmtTL(total)}
          </span>
        </div>
      )}
    </div>
  );
}
