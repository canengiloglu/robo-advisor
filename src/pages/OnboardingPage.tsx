import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const slides = [
  {
    icon: '◈',
    iconColor: '#6366F1',
    title: 'Duygusuz, matematiksel',
    desc: 'Piyasa dalgalanmalarında paniklemeden algoritmik kararlar al.',
  },
  {
    icon: '↑',
    iconColor: '#4ADE80',
    title: 'Asla satış önermiyor',
    desc: 'Yeni nakdi sadece eksik kalan varlıklara dağıtır.',
  },
  {
    icon: '◎',
    iconColor: '#FBBF24',
    title: 'Kademeli alım (DCA)',
    desc: 'Her ay düzenli yatırımla hedefe adım adım yaklaş.',
  },
];

export function OnboardingPage() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = (index: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
    setTimeout(() => {
      setCurrent(index);
      setVisible(true);
    }, 300);
  };

  const next = () => {
    if (current < slides.length - 1) {
      goTo(current + 1);
    } else {
      navigate('/setup');
    }
  };

  const skip = () => navigate('/setup');

  useEffect(() => {
    if (current < slides.length - 1) {
      timerRef.current = setTimeout(() => goTo(current + 1), 4000);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current]);

  const slide = slides[current];
  const progress = ((current + 1) / slides.length) * 100;

  return (
    <div
      style={{
        background: '#05070F',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 52 }}>
        <div
          style={{
            width: 56, height: 56,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
            boxShadow: '0 0 32px rgba(99,102,241,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 14 14" fill="none">
            <path d="M2 10L5.5 6L8 8.5L12 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="4" r="1.2" fill="white" />
          </svg>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#F8FAFC', fontSize: 18, fontWeight: 700, letterSpacing: '-0.5px' }}>Robo Advisor</div>
          <div style={{ color: '#475569', fontSize: 12, marginTop: 3 }}>Portföy Dengeleme Asistanı</div>
        </div>
      </div>

      {/* Slide */}
      <div
        style={{
          textAlign: 'center',
          maxWidth: 320,
          padding: '0 24px',
          transition: 'opacity 0.3s ease, transform 0.3s ease',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateX(0)' : 'translateX(-10px)',
        }}
      >
        <div style={{ fontSize: 52, lineHeight: 1, marginBottom: 22, color: slide.iconColor }}>
          {slide.icon}
        </div>
        <h2
          style={{
            color: '#F8FAFC',
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: '-0.5px',
            margin: '0 0 12px',
          }}
        >
          {slide.title}
        </h2>
        <p style={{ color: '#64748B', fontSize: 14, lineHeight: 1.65, margin: 0 }}>
          {slide.desc}
        </p>
      </div>

      {/* Dots */}
      <div style={{ display: 'flex', gap: 6, marginTop: 44 }}>
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            style={{
              width: i === current ? 18 : 6,
              height: 6,
              borderRadius: 3,
              border: 'none',
              cursor: 'pointer',
              background: i === current ? '#6366F1' : 'rgba(255,255,255,0.15)',
              transition: 'width 0.3s ease, background 0.3s ease',
              padding: 0,
            }}
          />
        ))}
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginTop: 36 }}>
        <button
          onClick={next}
          style={{
            background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            padding: '12px 36px',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            minWidth: 160,
            boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
            fontFamily: 'inherit',
          }}
        >
          {current < slides.length - 1 ? 'Devam →' : 'Başla ✓'}
        </button>
        <button
          onClick={skip}
          style={{
            background: 'transparent',
            color: '#475569',
            border: 'none',
            cursor: 'pointer',
            fontSize: 13,
            padding: '6px 16px',
            fontFamily: 'inherit',
          }}
        >
          Atla
        </button>
      </div>

      {/* Progress bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          height: 1,
          background: 'rgba(255,255,255,0.04)',
        }}
      >
        <div
          style={{
            height: '100%',
            background: 'linear-gradient(90deg, #4F46E5, #7C3AED)',
            width: `${progress}%`,
            transition: 'width 0.4s ease',
          }}
        />
      </div>
    </div>
  );
}
