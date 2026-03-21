import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Dashboard } from './pages/Dashboard';
import { HistoryPage } from './pages/HistoryPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { SetupPage } from './pages/SetupPage';
import { useSettingsStore } from './store/settingsStore';
import { usePortfolioStore } from './store/portfolioStore';
import { loadFromSupabase } from './lib/supabaseSync';

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#05070F' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #4F46E5', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function App() {
  const theme = useSettingsStore((s) => s.theme);
  const [loading, setLoading] = useState(true);
  const [onboardingDone, setOnboardingDone] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    loadFromSupabase().then((data) => {
      if (data && data.assets && data.assets.length > 0) {
        usePortfolioStore.setState({
          assets: data.assets,
          history: data.history ?? [],
          monthlyAdded: data.monthlyAdded ?? 0,
          monthlyAddedMonth: data.monthlyAddedMonth ?? '',
        });
        setOnboardingDone(true);
      } else {
        setOnboardingDone(false);
      }
      setLoading(false);
    }).catch(() => {
      setOnboardingDone(false);
      setLoading(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <LoadingScreen />;

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
        <Route path="/setup" element={<SetupPage onComplete={() => setOnboardingDone(true)} />} />
        <Route path="/" element={onboardingDone ? <Dashboard /> : <Navigate to="/onboarding" replace />} />
        <Route path="/history" element={onboardingDone ? <HistoryPage /> : <Navigate to="/onboarding" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
