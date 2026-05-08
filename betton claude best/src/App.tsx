import { useEffect } from 'react';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { useStore } from './store/useStore';
import { BetsList } from './components/BetsList';
import { BetDetail } from './components/BetDetail';
import { CreateBet } from './components/CreateBet';
import { Portfolio } from './components/Portfolio';
import { AdminPanel } from './components/AdminPanel';
import { Profile } from './components/Profile';
import { WalletButton } from './components/WalletButton';

const MANIFEST_URL = `${window.location.origin}/tonconnect-manifest.json`;

// ─── Tab config ────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'bets',      label: 'Рынки',    icon: '📈' },
  { key: 'create',    label: 'Создать',  icon: '➕' },
  { key: 'portfolio', label: 'Портфель', icon: '💼' },
  { key: 'profile',   label: 'Профиль',  icon: '👤' },
] as const;
type Tab = typeof TABS[number]['key'];

// ─── Inner app ─────────────────────────────────────────────────────────────────
function InnerApp() {
  const {
    activeTab, setActiveTab,
    selectedBetId,
    currentUser, setCurrentUser,
    viewingUserId, setViewingUserId,
    bets, updateFinancialMetrics,
  } = useStore();

  useEffect(() => { updateFinancialMetrics(); }, []);

  // Dev admin mode via ?admin=1
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get('admin') === '1') {
      setCurrentUser({ ...currentUser, isAdmin: true });
    }
  }, []);

  const pendingCount = bets.filter(b => !b.adminApproved && b.status === 'pending').length;

  const visibleTabs = currentUser.isAdmin
    ? [...TABS, { key: 'admin' as const, label: 'Админ', icon: '♟' }]
    : TABS;

  const handleTabClick = (key: Tab | 'admin') => {
    setViewingUserId(null);
    setActiveTab(key as Tab);
  };

  return (
    <div className="app-container" style={{ background: '#0d0f14' }}>
      {/* Top header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)',
                    flexShrink: 0, background: '#0d0f14' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>⚡</span>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
            Flash<span style={{ color: '#3b82f6' }}>Bet</span>
          </span>
        </div>
        <WalletButton />
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflow: 'hidden', paddingBottom: 'var(--tab-height, 64px)' }}>
        {activeTab === 'bets' && !selectedBetId && <BetsList />}
        {activeTab === 'bets' && selectedBetId && <BetDetail />}
        {activeTab === 'create' && <CreateBet />}
        {activeTab === 'portfolio' && <Portfolio />}
        {activeTab === 'admin' && <AdminPanel />}
        {activeTab === 'profile' && (
          viewingUserId && viewingUserId !== currentUser.id
            ? <Profile userId={viewingUserId} />
            : <Profile userId={null} />
        )}
      </div>

      {/* Bottom navigation */}
      <div className="bottom-nav" style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
                                            width: '100%', maxWidth: 760, height: 64 }}>
        <div style={{ display: 'flex', height: '100%', alignItems: 'center', paddingLeft: 8, paddingRight: 8 }}>
          {visibleTabs.map(tab => {
            const isActive = activeTab === tab.key;
            const hasBadge = tab.key === 'admin' && pendingCount > 0;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabClick(tab.key)}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', gap: 3, padding: '6px 4px', borderRadius: 10,
                  background: isActive ? 'rgba(255,255,255,0.07)' : 'transparent',
                  border: 'none', cursor: 'pointer', position: 'relative',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: 18, lineHeight: 1, filter: isActive ? 'none' : 'grayscale(0.4) opacity(0.5)' }}>
                  {tab.icon}
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 600, lineHeight: 1,
                  color: isActive ? '#f1f5f9' : '#475569',
                }}>
                  {tab.label}
                </span>
                {isActive && (
                  <div style={{ position: 'absolute', top: 2, left: '50%', transform: 'translateX(-50%)',
                                width: 16, height: 2, background: '#3b82f6', borderRadius: 1 }} />
                )}
                {hasBadge && (
                  <div style={{ position: 'absolute', top: 4, right: 8, width: 16, height: 16,
                                background: '#ef4444', borderRadius: '50%', display: 'flex',
                                alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 9, color: 'white', fontWeight: 700 }}>{pendingCount}</span>
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

// ─── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <TonConnectUIProvider manifestUrl={MANIFEST_URL}>
      <InnerApp />
    </TonConnectUIProvider>
  );
}
