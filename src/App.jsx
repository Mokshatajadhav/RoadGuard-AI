import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ComplaintProvider, useComplaints } from './context/ComplaintContext';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import LandingPage from './pages/LandingPage';
import CitizenDashboard from './pages/CitizenDashboard';
import ReportPotholePage from './pages/ReportPotholePage';
import TrackComplaintPage from './pages/TrackComplaintPage';
import AdminDashboard from './pages/AdminDashboard';
import PotholeMapPage from './pages/PotholeMapPage';
import { CheckCircle2, Info, AlertTriangle } from 'lucide-react';

function ToastContainer() {
  const { notification } = useComplaints();

  if (!notification) return null;

  const isError = notification.type === 'error';
  const isInfo = notification.type === 'info';

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-bounce-short">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold border ${
          isError
            ? 'bg-rose-900 text-white border-rose-700'
            : isInfo
            ? 'bg-slate-900 text-white border-slate-700'
            : 'bg-emerald-800 text-white border-emerald-600'
        }`}
      >
        {isError ? (
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
        ) : isInfo ? (
          <Info className="w-4 h-4 text-sky-400 shrink-0" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
        )}
        <span>{notification.message}</span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ComplaintProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
          <Header />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/citizen" element={<CitizenDashboard />} />
              <Route path="/map" element={<PotholeMapPage />} />
              <Route path="/report" element={<ReportPotholePage />} />
              <Route path="/track" element={<TrackComplaintPage />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
          <ToastContainer />
        </div>
      </BrowserRouter>
    </ComplaintProvider>
  );
}
