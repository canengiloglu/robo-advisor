import { Link, useLocation } from 'react-router-dom';
import { useT } from '../../hooks/useT';

export function AppNav() {
  const { pathname } = useLocation();
  const t = useT();

  const LINKS = [
    { to: '/',          label: t.panel },
    { to: '/history',   label: t.history },
    { to: '/analytics', label: t.analytics },
  ];

  return (
    <nav className="hidden md:flex items-center">
      {LINKS.map(({ to, label }) => {
        const active = pathname === to;
        return (
          <Link
            key={to}
            to={to}
            className="px-3 py-1 text-sm font-medium transition-colors duration-150"
            style={{
              color: active ? '#818CF8' : '#64748B',
              borderBottom: `2px solid ${active ? '#6366F1' : 'transparent'}`,
              lineHeight: '36px',
            }}
            onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLAnchorElement).style.color = '#CBD5E1'; }}
            onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLAnchorElement).style.color = '#64748B'; }}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
