import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type Theme = 'dark' | 'light';
export type Language = 'tr' | 'en';

interface SettingsStore {
  theme: Theme;
  language: Language;
  hasCompletedOnboarding: boolean;
  toggleTheme: () => void;
  toggleLanguage: () => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      theme: 'dark',
      language: 'tr',
      hasCompletedOnboarding: false,
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      toggleLanguage: () => set((s) => ({ language: s.language === 'tr' ? 'en' : 'tr' })),
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      resetOnboarding: () => set({ hasCompletedOnboarding: false }),
    }),
    {
      name: 'robo-advisor-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
