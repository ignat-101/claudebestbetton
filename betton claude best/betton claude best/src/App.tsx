import { useEffect } from 'react';
import { TonConnectUIProvider, useTonAddress } from '@tonconnect/ui-react';
import { useStore } from './store/useStore';
import { BetsList } from './components/BetsList';
import { BetDetail } from './components/BetDetail';
import { CreateBet } from './components/CreateBet';
import { Portfolio } from './components/Portfolio';
import { AdminPanel } from './components/AdminPanel';
import { Profile } from './components/Profile';
import { CryptoPriceTicker } from './components/CryptoPriceTicker';

const MANIFEST_URL = `${window.location.origin}/tonconnect-manifest.json`;

const Icons = {
  bets: (active: boolean) => (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke={active ? '#a78bfa' : 'rgba(255,255,255,0.35)'} strokeWidth={2}>
      <rect x="3" y="3" width="18" height="18" rx="2" strokeLinejoin="round" />
      <path d="M3 9h18M9 21V9" />
    </svg>
  ),
  create: (active: boolean) => (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke={active ? '#a78bfa' : 'rgba(255,255,255,0.35)'} strokeWidth={2}>
      <circle cx={12} cy={12} r={9} />
      <path d="M12 8v8M8 12h8" strokeLinecap="round" />
    </svg>
  ),
  portfolio: (active: boolean) => (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke={active ? '#a78bfa' : 'rgba(255,255,255,0.35)'} strokeWidth={2}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  admin: (active: boolean) => (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke={active ? '#a78bfa' : 'rgba(255,255,255,0.35)'} strokeWidth={2}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinejoin="round" />
    </svg>
  ),
  profile: (active: boolean) => (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke={active ? '#a78bfa' : 'rgba(255,255,255,0.35)'} strokeWidth={2}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx={12} cy={7} r={4} />
    </svg>
  ),
};

type Tab = 'bets' | 'create' | 'portfolio' | 'admin' | 'profile';

interface TabItem {
  key: Tab;
  label: string;
  adminOnly?: boolean;
}

const TABS: TabItem[] = [
  { key: 'bets', label: 'Ставки' },
  { key: 'create', label: 'Создать' },
  { key: 'portfolio', label: 'Портфолио' },
  { key: 'admin', label: 'Админ', adminOnly: true },
  { key: 'profile', label: 'Профиль' },
];

function AppInner() {
  const { activeTab, setActiveTab, selectedBetId, currentUser, setCurrentUser, setTonWalletAddress, bets } = useStore();
  const tonAddress = useTonAddress();

  useEffect(() => {
    // Initialize Telegram WebApp
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      tg.setHeaderColor?.('#050510');
      tg.setBackgroundColor?.('#050510');
      tg.disableVerticalSwipes?.();

      const tgUser = tg.initDataUnsafe?.user;
      if (tgUser) {
        setCurrentUser({
          ...currentUser,
          telegramId: tgUser.id,
          username: tgUser.username || `user_${tgUser.id}`,
          firstName: tgUser.first_name || 'User',
          lastName: tgUser.last_name,
          // Set admin by Telegram ID — replace with your real ID
          isAdmin: tgUser.id === 123456789 || currentUser.isAdmin,
        });
      }
    }
  }, []);

  // Sync TON wallet address to store
  useEffect(() => {
    setTonWalletAddress(tonAddress || null);
  }, [tonAddress]);

  const visibleTabs = TABS.filter((t) => !t.adminOnly || currentUser.isAdmin);

  return (
    <div className="fixed inset-0 bg-mesh flex flex-col overflow-hidden">
      {/* Animated background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="blob w-80 h-80 bg-purple-600 animate-float" style={{ top: '-5%', left: '-10%', animationDelay: '0s' }} />
        <div className="blob w-64 h-64 bg-blue-600 animate-float" style={{ bottom: '10%', right: '-5%', animationDelay: '1.5s' }} />
        <div className="blob w-48 h-48 bg-cyan-600 animate-float" style={{ top: '40%', left: '60%', animationDelay: '3s' }} />
      </div>

      {/* Crypto ticker */}
      <CryptoPriceTicker />

      {/* Main content */}
      <div className="flex-1 relative overflow-hidden">
        <div className={`absolute inset-0 transition-all duration-200 ${activeTab === 'bets' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <BetsList />
        </div>
        <div className={`absolute inset-0 transition-all duration-200 ${activeTab === 'create' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <CreateBet />
        </div>
        <div className={`absolute inset-0 transition-all duration-200 ${activeTab === 'portfolio' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <Portfolio />
        </div>
        <div className={`absolute inset-0 transition-all duration-200 ${activeTab === 'admin' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <AdminPanel />
        </div>
        <div className={`absolute inset-0 transition-all duration-200 ${activeTab === 'profile' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <Profile />
        </div>

        {/* Bet detail overlay */}
        {selectedBetId && (
          <div className="absolute inset-0 z-50">
            <BetDetail />
          </div>
        )}
      </div>

      {/* Bottom tab bar */}
      <div className="flex-shrink-0 tab-nav safe-bottom">
        <div className="flex items-center" style={{ height: '68px' }}>
          {visibleTabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const pendingCount = tab.key === 'admin'
              ? bets.filter((b) => b.status === 'pending').length
              : 0;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex-1 flex flex-col items-center justify-center gap-1 relative"
                style={{ height: '68px' }}
              >
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-gradient-to-r from-purple-500 to-blue-500" />
                )}
                <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'scale-100'}`}>
                  {Icons[tab.key](isActive)}
                </div>
                <span className={`text-[10px] font-semibold transition-colors duration-200 ${isActive ? 'text-purple-300' : 'text-white/30'}`}>
                  {tab.label}
                </span>
                {pendingCount > 0 && (
                  <span className="absolute top-2 right-1/4 bg-red-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <TonConnectUIProvider manifestUrl={MANIFEST_URL}>
      <AppInner />
    </TonConnectUIProvider>
  );
}
