import { useState, useEffect } from 'react';
import {
  Code2,
  Clock,
  ShieldAlert,
  Trophy,
  FileCode2,
  LayoutDashboard,
  LogOut,
  User,
  Wifi,
  WifiOff,
  RefreshCw,
  Terminal,
  ExternalLink,
} from 'lucide-react';
import { UserProfile, Contest } from '../types';
import { ApiService } from '../api';

export interface NavbarProps {
  user: UserProfile | null;
  contest: Contest | null;
  activeView: 'arena' | 'leaderboard' | 'submissions' | 'admin';
  setActiveView: (view: 'arena' | 'leaderboard' | 'submissions' | 'admin') => void;
  formattedTimer: string;
  isTimerUrgent: boolean;
  isTimerExpired: boolean;
  onUserChange: (user: UserProfile) => void;
  violationCount: number;
}

export function Navbar({
  user,
  contest,
  activeView,
  setActiveView,
  formattedTimer,
  isTimerUrgent,
  isTimerExpired,
  onUserChange,
  violationCount,
}: NavbarProps) {
  const [networkStatus, setNetworkStatus] = useState<'CONNECTED' | 'RECONNECTING' | 'OFFLINE'>('CONNECTED');
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  useEffect(() => {
    const handleOnline = () => setNetworkStatus('CONNECTED');
    const handleOffline = () => setNetworkStatus('OFFLINE');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const switchRole = async (role: 'ADMIN' | 'PARTICIPANT', customName?: string) => {
    try {
      setNetworkStatus('RECONNECTING');
      const u = await ApiService.devLogin(role, customName);
      onUserChange(u);
      setNetworkStatus('CONNECTED');
      setShowRoleMenu(false);
      if (role === 'ADMIN') {
        setActiveView('admin');
      } else if (activeView === 'admin') {
        setActiveView('arena');
      }
    } catch {
      setNetworkStatus('OFFLINE');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#121214] border-b border-white/5 text-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Brand & Contest Title */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            id="brand-logo"
            onClick={() => setActiveView('arena')}
            className="flex items-center gap-2.5 cursor-pointer font-bold text-base tracking-tight text-white hover:text-indigo-400 transition"
          >
            <div className="w-8 h-8 rounded bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
              <Code2 className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-sm font-semibold tracking-wide uppercase text-gray-100">
                CodeContest
              </span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                Arena
              </span>
            </div>
          </div>

          <div className="h-6 w-[1px] bg-white/5 hidden md:block" />

          <div className="hidden md:block truncate max-w-xs lg:max-w-md text-xs font-medium uppercase tracking-wide text-gray-400">
            {contest?.title || 'Intercollegiate Code Sprint'}
            <span className="text-gray-500 ml-1.5 text-[11px]">/ 2026</span>
          </div>
        </div>

        {/* Center: Server-Authoritative Timer */}
        {contest?.status === 'RUNNING' && (
          <div
            id="contest-timer-pill"
            className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg border transition-all ${
              isTimerExpired
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300 animate-pulse'
                : isTimerUrgent
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 animate-pulse'
                : 'bg-[#16161a] border-white/10 text-indigo-300'
            }`}
          >
            <Clock className={`w-3.5 h-3.5 ${isTimerUrgent ? 'text-amber-400' : 'text-indigo-400'}`} />
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-1.5">
              <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold hidden sm:inline">
                Time Remaining:
              </span>
              <span className="font-mono text-sm font-bold tracking-wider text-indigo-400 leading-none">
                {isTimerExpired ? '00:00:00 (ENDED)' : formattedTimer}
              </span>
            </div>
          </div>
        )}

        {/* Right Section: Navigation, Network State, Role Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Navigation Links */}
          <nav className="flex items-center gap-1 bg-[#16161a] p-1 rounded-lg border border-white/5">
            <button
              id="nav-btn-arena"
              onClick={() => setActiveView('arena')}
              className={`px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition flex items-center gap-1.5 ${
                activeView === 'arena'
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/40 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Problems</span>
            </button>

            <button
              id="nav-btn-leaderboard"
              onClick={() => setActiveView('leaderboard')}
              className={`px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition flex items-center gap-1.5 ${
                activeView === 'leaderboard'
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/40 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Leaderboard</span>
            </button>

            <button
              id="nav-btn-submissions"
              onClick={() => setActiveView('submissions')}
              className={`px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition flex items-center gap-1.5 ${
                activeView === 'submissions'
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/40 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Submissions</span>
            </button>

            {user?.role === 'ADMIN' && (
              <button
                id="nav-btn-admin"
                onClick={() => setActiveView('admin')}
                className={`px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition flex items-center gap-1.5 ${
                  activeView === 'admin'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                    : 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}
          </nav>

          {/* Network Status Badge */}
          <div
            id="network-status-badge"
            title={`Network Connection: ${networkStatus}`}
            className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full border ${
              networkStatus === 'CONNECTED'
                ? 'bg-green-500/10 border-green-500/20 text-green-400'
                : networkStatus === 'RECONNECTING'
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                networkStatus === 'CONNECTED'
                  ? 'bg-green-500 animate-pulse'
                  : networkStatus === 'RECONNECTING'
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-rose-500'
              }`}
            />
            <span className="text-[11px] font-medium uppercase tracking-tight font-mono">
              {networkStatus}
            </span>
          </div>

          {/* Role Switcher & User Profile Menu */}
          <div className="relative">
            <button
              id="user-profile-trigger"
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#16161a] border border-white/10 hover:border-white/20 transition text-xs"
            >
              <div className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-[10px]">
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="font-medium text-gray-300 hidden sm:inline max-w-[100px] truncate">
                {user?.displayName || 'User'}
              </span>
              <span
                className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                  user?.role === 'ADMIN'
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                }`}
              >
                {user?.role || 'PARTICIPANT'}
              </span>
            </button>

            {/* Dropdown Menu for Switching Roles (Admin / Participant) */}
            {showRoleMenu && (
              <div
                id="role-switch-dropdown"
                className="absolute right-0 mt-2 w-64 rounded-xl bg-[#121214] border border-white/10 shadow-2xl p-2 z-50 text-xs text-gray-300"
              >
                <div className="p-2 border-b border-white/5 mb-1">
                  <p className="font-semibold text-gray-100">{user?.displayName}</p>
                  <p className="text-gray-500 text-[11px] truncate">{user?.email}</p>
                  {violationCount > 0 && (
                    <div className="mt-1.5 flex items-center gap-1 text-amber-400 text-[11px]">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>{violationCount} integrity flag(s)</span>
                    </div>
                  )}
                </div>

                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 py-1">
                  Role Switcher
                </div>

                <button
                  id="btn-switch-admin"
                  onClick={() => switchRole('ADMIN', 'Contest Chief Administrator')}
                  className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between transition ${
                    user?.role === 'ADMIN'
                      ? 'bg-rose-500/10 text-rose-300 font-semibold border border-rose-500/20'
                      : 'hover:bg-white/5 text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4 text-rose-400" />
                    <span>Admin Mode</span>
                  </div>
                  {user?.role === 'ADMIN' && <span className="text-[10px] text-rose-400">● Active</span>}
                </button>

                <button
                  id="btn-switch-participant"
                  onClick={() => switchRole('PARTICIPANT', 'Jordan Reed (MIT)')}
                  className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between transition ${
                    user?.role === 'PARTICIPANT'
                      ? 'bg-indigo-500/10 text-indigo-300 font-semibold border border-indigo-500/20'
                      : 'hover:bg-white/5 text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-400" />
                    <span>Participant Mode</span>
                  </div>
                  {user?.role === 'PARTICIPANT' && <span className="text-[10px] text-indigo-400">● Active</span>}
                </button>

                <div className="border-t border-white/5 mt-1 pt-1">
                  <button
                    onClick={() => switchRole('PARTICIPANT', `Contestant #${Math.floor(100 + Math.random() * 900)}`)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-white/5 transition text-[11px] flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Simulate New Participant</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
