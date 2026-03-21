interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium text-[#94a3b8] tracking-wide uppercase">
          {label}
        </label>
      )}
      <input
        className={`
          bg-[#0a0a0f] rounded-xl px-3 py-2
          text-sm text-[#f8fafc] tabular-nums
          placeholder:text-[#94a3b8]/30
          focus:outline-none focus:shadow-[0_0_0_3px_rgba(99,102,241,0.15)]
          hover:border-[#2a2a3e]
          transition-all duration-200
          border
          ${error
            ? 'border-[#ef4444] focus:border-[#ef4444] focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]'
            : 'border-[#1e1e2e] focus:border-[#6366f1]/60'
          }
          ${className}
        `}
        {...props}
      />
      <p className="text-xs text-[#ef4444] mt-0.5" style={{ minHeight: '1.25rem' }}>
        {error ?? ''}
      </p>
    </div>
  );
}
