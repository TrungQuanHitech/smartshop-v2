import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';

// Lazy load pages
import { Suspense, lazy } from 'react';

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const POS = lazy(() => import('@/pages/POS'));
const Inventory = lazy(() => import('@/pages/Inventory'));
const Purchases = lazy(() => import('@/pages/Purchases'));
const Partners = lazy(() => import('@/pages/Partners'));
const CashFlow = lazy(() => import('@/pages/CashFlow'));
const RepairService = lazy(() => import('@/pages/service/RepairService'));
const RentalService = lazy(() => import('@/pages/service/RentalService'));
const Reports = lazy(() => import('@/pages/Reports'));
const SettingsPage = lazy(() => import('@/pages/Settings'));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="pos" element={<POS />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="purchases" element={<Purchases />} />
            <Route path="partners" element={<Partners />} />
            <Route path="cashflow" element={<CashFlow />} />
            <Route path="service/repair" element={<RepairService />} />
            <Route path="service/rental" element={<RentalService />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
