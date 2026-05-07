import { useEffect } from 'react';
import { useStore } from './store/useStore';
import { CryptoTicker } from './components/CryptoTicker';
import { BetsList } from './components/BetsList';
import { BetDetail } from './components/BetDetail';
import { CreateBet } from './components/CreateBet';
import { Portfolio } from './components/Portfolio';
import { AdminPanel } from './components/AdminPanel';
import { Profile } from './components/Profile';
import { Leaderboard } from './components/Leaderboard';

// ─────────────────────────────────────────────────────────
// TAB CONFIG
// ─────────────────────────────────────────────────────────
const TABS = [
  { key: 'bets',        label: 'Рынки',    icon: '📊' },
  { key: 'leaderboard', label: 'Топ',       icon: '🏆' },
  { key: 'create',      label: 'Создать',   icon: '➕' },
  { key: 'portfolio',   label: 'Портфель',  icon: '💼' },
  { key: 'profile',     label: 'Профиль',   icon: '👤' },
] as const;

type Tab = typeof TABS[number]['key'];

// ─────────────────────────────────────────────────────────
// INNER APP
// ─────────────────────────────────────────────────────────
function InnerApp() {
  const {
    activeTab, setActiveTab,
    selectedBetId,
    currentUser, setCurrentUser,
    tonWalletAddress,
    viewingUserId, setViewingUserId,
    bets, updateFinancialMetrics,
  } = useStore();

  // Init financial metrics
  useEffect(() => { updateFinancialMetrics(); }, []);

  // Demo: simulate Telegram initData & wallet connection for preview
  useEffect(() => {
    // In production: parse window.Telegram.WebApp.initData and verify HMAC server-side
    // isAdmin is NEVER set client-side from user input — backend only
    // Here we allow demo mode by checking URL param ?admin=1 (dev only, never in production)
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === '1' && import.meta.env.DEV) {
      setCurrentUser({ ...currentUser, isAdmin: true });
    }
    // Simulate a connected wallet for demo
    if (!tonWalletAddress) {
      // Comment out to require real TON Connect wallet
      // setTonWalletAddress('demo_wallet_address');
    }
  }, []);

  const pendingCount = bets.filter(b => !b.adminApproved && b.status === 'pending').length;
  const visibleTabs = currentUser.isAdmin
    ? [...TABS, { key: 'admin' as const, label: 'Админ', icon: '⚙️' }]
    : TABS;

  const handleTabClick = (key: Tab | 'admin') => {
    setViewingUserId(null);
    setActiveTab(key as any);
  };

  return (
    <div className="flex flex-col h-full max-w-md mx-auto bg-mesh" style={{ height: '100dvh' }}>
      {/* Crypto ticker */}
      <CryptoTicker />

      {/* Main content */}
      <div className="flex-1 overflow-hidden" style={{ paddingBottom: 'var(--tab-height)' }}>
        {activeTab === 'bets' && !selectedBetId && <BetsList />}
        {activeTab === 'bets' && selectedBetId && <BetDetail />}
        {activeTab === 'create' && <CreateBet />}
        {activeTab === 'portfolio' && <Portfolio />}
        {activeTab === 'admin' && <AdminPanel />}
        {activeTab === 'leaderboard' && <Leaderboard />}
        {activeTab === 'profile' && (
          viewingUserId && viewingUserId !== currentUser.id
            ? <Profile userId={viewingUserId} />
            : <Profile userId={null} />
        )}
      </div>

      {/* Bottom tab bar */}
      <div className="tab-nav fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md" style={{ height: 'var(--tab-height)' }}>
        <div className="flex h-full items-center px-2">
          {visibleTabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const hasBadge = tab.key === 'admin' && pendingCount > 0;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabClick(tab.key)}
                className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-white/8 text-white'
                    : 'text-white/35 hover:text-white/60'
                }`}
              >
                <span className={`text-[20px] leading-none transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                  {tab.icon}
                </span>
                <span className={`text-[9px] font-semibold leading-none transition-all ${isActive ? 'text-white' : 'text-white/35'}`}>
                  {tab.label}
                </span>
                {isActive && (
                  <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-purple-400 rounded-full" />
                )}
                {hasBadge && (
                  <div className="absolute top-1 right-2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-[9px] text-white font-bold">{pendingCount}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────────────────
export default function App() {
  return <InnerApp />;
}
