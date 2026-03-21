import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Dashboard } from './pages/Dashboard';
import { HistoryPage } from './pages/HistoryPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { SetupPage } from './pages/SetupPage';
import { useSettingsStore } from './store/settingsStore';
import { usePortfolioStore } from './store/portfolioStore';
import { loadFromSupabase } from './lib/supabaseSync';

function RequireOnboarding({ children }: { children: React.ReactNode }) {
  const hasCompletedOnboarding = useSettingsStore((s) => s.hasCompletedOnboarding);
  if (!hasCompletedOnboarding) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

export default function App() {
  const theme = useSettingsStore((s) => s.theme);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const supabaseConfigured = !!import.meta.env.VITE_SUPABASE_URL;

    loadFromSupabase().then((data) => {
      if (data && data.assets && data.assets.length > 0) {
        // Supabase'de veri var — store'u güncelle ve onboarding'i tamamlandı say
        console.log('Loading from Supabase:', data);
        usePortfolioStore.setState({
          assets: data.assets,
          history: data.history ?? [],
          monthlyAdded: data.monthlyAdded ?? 0,
          monthlyAddedMonth: data.monthlyAddedMonth ?? '',
        });
        useSettingsStore.getState().completeOnboarding();
        console.log('Store updated from Supabase:', data.assets.length, 'assets');
      } else if (supabaseConfigured) {
        // Supabase yapılandırılmış ama veri yok — onboarding'e gönder
        console.log('No Supabase data, redirecting to onboarding');
        useSettingsStore.getState().resetOnboarding();
      } else {
        // Supabase yapılandırılmamış — localStorage'a dokuma
        console.log('Supabase not configured, using localStorage');
      }
    }).catch(console.error);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <BrowserRouter>
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: '#111118',
            color: '#f8fafc',
            border: '1px solid #22c55e33',
            borderRadius: 12,
            fontSize: 13,
            fontFamily: 'Inter, sans-serif',
            padding: '12px 16px',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#111118' } },
        }}
      />
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/" element={<RequireOnboarding><Dashboard /></RequireOnboarding>} />
        <Route path="/history" element={<RequireOnboarding><HistoryPage /></RequireOnboarding>} />
      </Routes>
    </BrowserRouter>
  );
}
