import React, { useState } from 'react';
import { useRescue } from '../../context/RescueContext';
import {
  Menu,
  X,
  AlertTriangle,
  ShieldCheck,
  User,
  LogOut,
  ChevronDown,
  Bell,
  Sparkles,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    currentRoute,
    navigateTo,
    currentUser,
    logout,
    isAuthenticated,
    testMode,
    setTestMode,
    notifications,
    unreadNotificationsCount,
    markNotificationRead,
  } = useRescue();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const navLinks = [
    { label: 'How It Works', path: '/#how-it-works' },
    { label: 'Rescue Network', path: '/network' },
    { label: 'Track Rescue', path: '/track' },
    { label: 'Our Impact', path: '/impact' },
    { label: 'Support & CSR', path: '/support' },
  ];

  const handleNavClick = (path: string) => {
    setMobileMenuOpen(false);
    if (path.startsWith('/#')) {
      if (currentRoute !== '/') {
        navigateTo('/');
        setTimeout(() => {
          const el = document.getElementById(path.replace('/#', ''));
          el?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        const el = document.getElementById(path.replace('/#', ''));
        el?.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigateTo(path);
    }
  };

  const getUserDashboardRoute = () => {
    if (!currentUser) return '/login';
    switch (currentUser.role) {
      case 'rescuer':
        return '/responder/dashboard';
      case 'vet':
        return '/vet/dashboard';
      case 'ngo':
        return '/shelter/dashboard';
      case 'admin':
        return '/admin/dashboard';
      case 'citizen':
      default:
        return '/citizen/dashboard';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#F8FAF7]/95 backdrop-blur-md border-b border-stone-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Brand Logo & Wordmark */}
          <button
            onClick={() => handleNavClick('/')}
            className="flex items-center gap-2.5 text-left group whitespace-nowrap shrink-0 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-[#145C4A] flex items-center justify-center text-white shadow-xs group-hover:bg-[#20A67A] transition-colors">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2">
                <path
                  d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                  fill="currentColor"
                  fillOpacity="0.2"
                />
                <circle cx="12" r="2.2" cy="8" fill="white" stroke="none" />
                <circle cx="9.2" r="1.3" cy="11.5" fill="white" stroke="none" />
                <circle cx="14.8" r="1.3" cy="11.5" fill="white" stroke="none" />
                <circle cx="8" r="1.1" cy="8.5" fill="white" stroke="none" />
                <circle cx="16" r="1.1" cy="8.5" fill="white" stroke="none" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-extrabold tracking-tight text-[#145C4A] uppercase font-display leading-tight">
                PawSOS
              </div>
              <div className="text-[10px] font-semibold text-[#20A67A] tracking-wider uppercase leading-none">
                Animal Emergency Network
              </div>
            </div>
          </button>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-[13px] font-medium text-stone-700">
            {navLinks.map((item) => {
              const isActive = currentRoute === item.path;
              return (
                <button
                  key={item.label}
                  onClick={() => handleNavClick(item.path)}
                  className={`whitespace-nowrap shrink-0 transition-colors py-1 relative cursor-pointer ${
                    isActive ? 'text-[#145C4A] font-bold' : 'hover:text-[#145C4A]'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#20A67A] rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action & Controls Area */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Safe Test Mode Switcher */}
            <button
              onClick={() => setTestMode(!testMode)}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all border shadow-2xs cursor-pointer ${
                testMode
                  ? 'bg-amber-100 text-amber-900 border-amber-300 ring-1 ring-amber-400'
                  : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
              }`}
              title="Toggle Safe Isolated Test Mode for Development"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>{testMode ? 'Test Mode: ON' : 'Test Mode'}</span>
            </button>

            {/* In-App Notifications Dropdown */}
            {isAuthenticated && (
              <div className="relative">
                <button
                  onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                  className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl relative transition-colors cursor-pointer"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  )}
                </button>

                {notifDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-stone-200 py-2 z-50 animate-in fade-in duration-100">
                    <div className="px-4 py-2 border-b border-stone-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                        Notifications ({notifications.length})
                      </span>
                      {unreadNotificationsCount > 0 && (
                        <span className="bg-rose-100 text-rose-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                          {unreadNotificationsCount} new
                        </span>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-stone-100">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-stone-400">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              markNotificationRead(n.id);
                              if (n.caseId) {
                                navigateTo(`/track?id=${n.caseId}`);
                                setNotifDropdownOpen(false);
                              }
                            }}
                            className={`p-3 text-xs cursor-pointer transition-colors ${
                              !n.readStatus ? 'bg-emerald-50/50 hover:bg-emerald-50' : 'hover:bg-stone-50'
                            }`}
                          >
                            <div className="font-bold text-stone-900 text-xs mb-0.5">{n.title}</div>
                            <div className="text-[11px] text-stone-600 line-clamp-2">{n.message}</div>
                            <div className="text-[10px] text-stone-400 mt-1">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Authenticated User Menu */}
            {isAuthenticated && currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-stone-800 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl shadow-2xs cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-lg bg-[#145C4A]/10 text-[#145C4A] font-bold text-xs flex items-center justify-center">
                    {currentUser.fullName.charAt(0)}
                  </div>
                  <span className="max-w-[110px] truncate font-semibold">{currentUser.fullName}</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-[#145C4A]/10 text-[#145C4A] font-bold rounded uppercase">
                    {currentUser.role}
                  </span>
                  <ChevronDown className="w-3 h-3 text-stone-400" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-stone-200 py-1.5 z-50 animate-in fade-in duration-100">
                    <div className="px-4 py-2 border-b border-stone-100">
                      <div className="text-xs font-bold text-stone-900 truncate">{currentUser.fullName}</div>
                      <div className="text-[11px] text-stone-400 truncate">{currentUser.email}</div>
                      <div className="mt-1 flex items-center gap-1">
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                            currentUser.verificationStatus === 'verified'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          Status: {currentUser.verificationStatus}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        navigateTo(getUserDashboardRoute());
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 flex items-center gap-2 cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-[#20A67A]" />
                      <span>My Operations Dashboard</span>
                    </button>

                    <div className="h-px bg-stone-100 my-1" />

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={() => navigateTo('/login')}
                  className="px-3 py-1.5 text-xs font-bold text-stone-700 hover:text-[#145C4A] hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigateTo('/register')}
                  className="px-3 py-1.5 text-xs font-bold text-[#145C4A] bg-[#145C4A]/10 hover:bg-[#145C4A]/20 rounded-xl transition-colors cursor-pointer"
                >
                  Join Network
                </button>
              </div>
            )}

            {/* Primary Emergency SOS Button */}
            <button
              onClick={() => navigateTo('/report')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-extrabold text-white bg-[#E65353] hover:bg-[#d64545] rounded-xl shadow-xs transition-all whitespace-nowrap shrink-0 active:scale-98 cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Report SOS</span>
            </button>

            {/* Mobile Drawer Trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-stone-700 hover:text-stone-900 rounded-xl hover:bg-stone-100 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-stone-200 px-4 pt-3 pb-6 shadow-xl animate-in fade-in slide-in-from-top duration-150">
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setTestMode(!testMode)}
              className={`w-full text-left px-3 py-2 text-xs font-bold rounded-xl flex items-center justify-between ${
                testMode ? 'bg-amber-100 text-amber-900' : 'bg-stone-100 text-stone-700'
              }`}
            >
              <span>Test Mode: {testMode ? 'Active (Isolated)' : 'Inactive'}</span>
              <Sparkles className="w-4 h-4 text-amber-600" />
            </button>

            {navLinks.map((item) => (
              <button
                key={item.label}
                onClick={() => handleNavClick(item.path)}
                className="text-left px-3 py-2 text-sm font-semibold text-stone-700 hover:text-[#145C4A] hover:bg-stone-50 rounded-xl transition-colors"
              >
                {item.label}
              </button>
            ))}

            <div className="h-px bg-stone-100 my-2" />

            {isAuthenticated && currentUser ? (
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigateTo(getUserDashboardRoute());
                  }}
                  className="w-full text-left px-3 py-2.5 text-xs font-bold text-[#145C4A] bg-emerald-50 rounded-xl"
                >
                  My Dashboard ({currentUser.role})
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigateTo('/login');
                  }}
                  className="px-3 py-2 text-xs font-bold text-center text-stone-700 bg-stone-50 hover:bg-stone-100 rounded-xl border border-stone-200"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigateTo('/register');
                  }}
                  className="px-3 py-2 text-xs font-bold text-center text-[#145C4A] bg-[#145C4A]/10 hover:bg-[#145C4A]/20 rounded-xl"
                >
                  Join Network
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
