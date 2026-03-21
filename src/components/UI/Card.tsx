import { useThemeColors } from '../../hooks/useThemeColors';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Card({ children, className = '', style }: CardProps) {
  const c = useThemeColors();
  return (
    <div
      className={`relative rounded-2xl transition-all duration-150 ${className}`}
      style={{
        background: c.bgCardAlt,
        border: `1px solid ${c.border}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
