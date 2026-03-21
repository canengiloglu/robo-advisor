import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type Theme = 'dark' | 'light';
export type Language = 'tr' | 'en';

interface SettingsStore {
  theme: Theme;
  language: Language;
  toggleTheme: () => void;
  toggleLanguage: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      theme: 'dark',
      language: 'tr',
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      toggleLanguage: () => set((s) => ({ language: s.language === 'tr' ? 'en' : 'tr' })),
    }),
    {
      name: 'robo-advisor-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
