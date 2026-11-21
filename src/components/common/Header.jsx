import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ShieldAlert,
  Camera,
  Search,
  LayoutDashboard,
  ShieldCheck,
  Menu,
  X,
  Radio,
  Home,
  MapPin,
  User as UserIcon,
  LogIn,
  LogOut,
} from 'lucide-react';
import { useComplaints } from '../../context/ComplaintContext';
import Modal from './Modal';

export default function Header() {
  const { currentUser, loginUser, registerUser, logoutUser } = useComplaints();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authRole, setAuthRole] = useState('citizen');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  const location = useLocation();

  const navLinks = [
    { to: '/', label: 'Overview', icon: Home },
    { to: '/citizen', label: 'Citizen Portal', icon: LayoutDashboard },
    { to: '/map', label: 'Pothole Map', icon: MapPin },
    { to: '/report', label: 'Report Pothole', icon: Camera, highlight: true },
    { to: '/track', label: 'Track Complaint', icon: Search },
    { to: '/admin', label: 'Admin Desk', icon: ShieldCheck }
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Civic Branding */}
          <Link
            to="/"
            className="flex items-center gap-3 group focus:outline-hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-900 to-navy-900 flex items-center justify-center text-emerald-400 shadow-md shadow-emerald-950/10 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-slate-900">
                  RoadGuard<span className="text-emerald-600">.AI</span>
                </span>
                <span className="hidden sm:inline-flex items-center text-[10px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Smart City
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium -mt-1 hidden md:block">
                Intelligent Pothole Detection & Maintenance
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const active = isActive(link.to);
              const Icon = link.icon;

              if (link.highlight) {
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all shadow-xs ${
                      active
                        ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                        : 'bg-emerald-500 hover:bg-emerald-600 text-white hover:shadow-emerald-500/20'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </Link>
                );
              }

              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Civic Grid Status & User Auth Pill */}
          <div className="hidden lg:flex items-center gap-3 pl-3 border-l border-slate-200">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[120px]">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
                    {currentUser.role}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={logoutUser}
                  title="Log out of account"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setAuthError(null);
                  setAuthModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5 text-emerald-600" />
                <span>Sign In</span>
              </button>
            )}

            <div className="hidden xl:flex items-center gap-1.5 text-xs font-medium text-slate-500 pl-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>City PWD Grid</span>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-1.5">
            {currentUser ? (
              <button
                type="button"
                onClick={logoutUser}
                className="p-1.5 text-xs text-rose-600 font-bold"
              >
                Log Out
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setAuthError(null);
                  setAuthModalOpen(true);
                }}
                className="p-1.5 text-xs font-bold text-emerald-700"
              >
                Sign In
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-hidden"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2 animate-fadeIn shadow-lg">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 text-xs text-slate-500">
            <span>Municipal Pothole Grievance Portal</span>
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
              <Radio className="w-3 h-3 animate-pulse" /> Live Grid
            </span>
          </div>
          {navLinks.map((link) => {
            const active = isActive(link.to);
            const Icon = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-emerald-50 text-emerald-800 font-semibold'
                    : 'text-slate-700 hover:bg-slate-100'
                } ${link.highlight && !active ? 'border border-emerald-300 bg-emerald-50/50 text-emerald-800' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${active ? 'text-emerald-600' : 'text-slate-500'}`} />
                  <span>{link.label}</span>
                </div>
                {link.highlight && (
                  <span className="text-[10px] uppercase font-bold bg-emerald-600 text-white px-2 py-0.5 rounded">
                    Action
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {/* User Authentication Modal (Sign In / Register) */}
      {authModalOpen && (
        <Modal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          title={authMode === 'login' ? 'Citizen & Municipal Sign In' : 'Create Civic Grievance Account'}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setAuthLoading(true);
              setAuthError(null);
              try {
                if (authMode === 'login') {
                  await loginUser(authEmail, authPassword);
                } else {
                  await registerUser({
                    name: authName,
                    email: authEmail,
                    password: authPassword,
                    role: authRole,
                  });
                }
                setAuthModalOpen(false);
                setAuthEmail('');
                setAuthPassword('');
                setAuthName('');
              } catch (err) {
                setAuthError(err.message || 'Authentication failed');
              } finally {
                setAuthLoading(false);
              }
            }}
            className="space-y-4 text-xs"
          >
            <p className="text-slate-600">
              {authMode === 'login'
                ? 'Sign in to track filed grievances, sign off on repaired potholes, or access administrative operations.'
                : 'Register your municipal citizen profile to report road damage and endorse civic complaints.'}
            </p>

            {authMode === 'login' && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  1-Click Demo Profiles:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthEmail('citizen@smartcity.gov.in');
                      setAuthPassword('citizen123');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-emerald-500 text-slate-700 font-semibold text-[11px] transition-colors shadow-2xs"
                  >
                    Citizen Demo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthEmail('admin@roadguard.gov.in');
                      setAuthPassword('admin123');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-emerald-500 text-slate-700 font-semibold text-[11px] transition-colors shadow-2xs"
                  >
                    Admin Desk
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthEmail('crew@pwd.gov.in');
                      setAuthPassword('crew123');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-emerald-500 text-slate-700 font-semibold text-[11px] transition-colors shadow-2xs"
                  >
                    PWD Crew
                  </button>
                </div>
              </div>
            )}

            {authMode === 'register' && (
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Full Name</label>
                <input
                  type="text"
                  required
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="block font-bold text-slate-700">Email Address</label>
              <input
                type="email"
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="citizen@smartcity.gov.in"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-slate-700">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            {authMode === 'register' && (
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Account Role</label>
                <select
                  value={authRole}
                  onChange={(e) => setAuthRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden bg-white"
                >
                  <option value="citizen">Citizen Reporter</option>
                  <option value="admin">Public Works Administrator (Admin)</option>
                  <option value="crew">Contractor Maintenance Crew</option>
                </select>
              </div>
            )}

            {authError && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {authError}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'register' : 'login');
                  setAuthError(null);
                }}
                className="text-emerald-700 hover:underline font-semibold"
              >
                {authMode === 'login' ? 'Need an account? Register' : 'Already have an account? Sign in'}
              </button>

              <button
                type="submit"
                disabled={authLoading}
                className="px-5 py-2 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {authLoading ? 'Processing…' : authMode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </header>
  );
}
