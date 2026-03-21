interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const base =
    'px-4 py-2 rounded-xl font-medium text-sm transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed';

  const variants = {
    primary: `
      text-white font-semibold
      shadow-[0_4px_16px_rgba(99,102,241,0.25)]
      hover:-translate-y-px hover:shadow-[0_6px_24px_rgba(99,102,241,0.4)]
      active:scale-[0.98] active:translate-y-0
    `,
    secondary:
      'bg-transparent border border-[rgba(255,255,255,0.07)] text-[#64748B] hover:text-[#F8FAFC] hover:border-[rgba(99,102,241,0.25)]',
    ghost:
      'text-[#64748B] hover:text-[#F8FAFC] hover:bg-white/5',
  };

  const primaryStyle = variant === 'primary'
    ? { background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }
    : {};

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      style={primaryStyle}
      {...props}
    />
  );
}
