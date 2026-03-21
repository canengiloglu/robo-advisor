import { useSettingsStore } from '../store/settingsStore';

export interface ThemeColors {
  bgBase: string;
  bgCard: string;
  bgCardAlt: string;
  bgHeader: string;
  bgSubtle: string;
  bgHoverRow: string;
  border: string;
  borderSubtle: string;
  borderVerySubtle: string;
  textPrimary: string;
  textSecondary: string;
  textDim: string;
  textDisabled: string;
  cardGradient: string;
}

const dark: ThemeColors = {
  bgBase: '#080B12',
  bgCard: '#0F1420',
  bgCardAlt: '#0A0E1A',
  bgHeader: 'rgba(8,11,18,0.85)',
  bgSubtle: 'rgba(255,255,255,0.015)',
  bgHoverRow: 'rgba(99,102,241,0.03)',
  border: 'rgba(255,255,255,0.06)',
  borderSubtle: 'rgba(255,255,255,0.05)',
  borderVerySubtle: 'rgba(255,255,255,0.04)',
  textPrimary: '#F8FAFC',
  textSecondary: '#64748B',
  textDim: '#475569',
  textDisabled: 'rgba(100,116,139,0.3)',
  cardGradient: 'linear-gradient(145deg, #0D1220, #0A0E1A)',
};

const light: ThemeColors = {
  bgBase: '#F8FAFC',
  bgCard: '#FFFFFF',
  bgCardAlt: '#F1F5F9',
  bgHeader: 'rgba(248,250,252,0.92)',
  bgSubtle: 'rgba(0,0,0,0.025)',
  bgHoverRow: 'rgba(99,102,241,0.04)',
  border: 'rgba(0,0,0,0.08)',
  borderSubtle: 'rgba(0,0,0,0.07)',
  borderVerySubtle: 'rgba(0,0,0,0.04)',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textDim: '#64748B',
  textDisabled: 'rgba(15,23,42,0.2)',
  cardGradient: 'linear-gradient(145deg, #FFFFFF, #F1F5F9)',
};

export const useThemeColors = (): ThemeColors => {
  const theme = useSettingsStore(s => s.theme);
  return theme === 'dark' ? dark : light;
};
