import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/common/Layout';
import ErrorBoundary from './components/common/ErrorBoundary';

// Lazy-loaded routes for performance & code-splitting
const SplashPage = lazy(() => import('./pages/SplashPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const ResultPage = lazy(() => import('./pages/ResultPage'));
const StepsPage = lazy(() => import('./pages/StepsPage'));
const MapPage = lazy(() => import('./pages/MapPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const HelpPage = lazy(() => import('./pages/HelpPage'));
const AdminPortal = lazy(() => import('./pages/AdminPortal'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Lightweight accessible loading fallback
const PageLoader = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3" role="status" aria-live="polite">
    <div className="w-9 h-9 border-3 border-primary border-t-transparent rounded-full animate-spin" />
    <span className="text-xs font-semibold text-slate-500">লোড হচ্ছে...</span>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Standalone full-screen Splash screen */}
          <Route path="/" element={<SplashPage />} />

          {/* Pages wrapped with shared Layout (Header + BottomNav) */}
          <Route
            path="/home"
            element={
              <Layout>
                <HomePage />
              </Layout>
            }
          />
          <Route
            path="/result"
            element={
              <Layout>
                <ResultPage />
              </Layout>
            }
          />
          <Route
            path="/steps"
            element={
              <Layout>
                <StepsPage />
              </Layout>
            }
          />
          <Route
            path="/checklist"
            element={
              <Layout>
                <StepsPage />
              </Layout>
            }
          />
          <Route
            path="/notices"
            element={
              <Layout>
                <StepsPage />
              </Layout>
            }
          />
          <Route
            path="/faq"
            element={
              <Layout>
                <StepsPage />
              </Layout>
            }
          />
          <Route
            path="/map/:centerId"
            element={
              <Layout>
                <MapPage />
              </Layout>
            }
          />
          <Route
            path="/about"
            element={
              <Layout>
                <AboutPage />
              </Layout>
            }
          />
          <Route
            path="/help"
            element={
              <Layout>
                <HelpPage />
              </Layout>
            }
          />
          <Route
            path="/admin/*"
            element={
              <Layout>
                <AdminPortal />
              </Layout>
            }
          />

          {/* Custom 404 Page */}
          <Route
            path="*"
            element={
              <Layout>
                <NotFoundPage />
              </Layout>
            }
          />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
