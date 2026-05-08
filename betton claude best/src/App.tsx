import { useEffect } from 'react';
import { useStore, type Tab } from './store/useStore';
import { BetsList } from './components/BetsList';
import { BetDetail } from './components/BetDetail';
import { CreateBet } from './components/CreateBet';
import { Portfolio } from './components/Portfolio';
import { PosVoting } from './components/PosVoting';
import { Profile } from './components/Profile';
import { AdminPanel } from './components/AdminPanel';
import { WalletConnect } from './components/WalletConnect';

// ─── Bottom nav tabs (normal users) ──────────────────────────────────────────
const TABS = [
  { key: 'bets'      as const, label: 'Рынки',   icon: '📊' },
  { key: 'create'    as const, label: 'Создать',  icon: '✚'  },
  { key: 'portfolio' as const, label: 'Портфель', icon: '💼' },
  { key: 'vote'      as const, label: 'Голосование', icon: '🗳' },
  { key: 'profile'   as const, label: 'Профиль',  icon: '👤' },
] satisfies { key: Tab; label: string; icon: string }[];

export default function App() {
  const {
    activeTab, setActiveTab,
    selectedBetId,
    viewingUserId, setViewingUserId,
    currentUser,
    isAdmin, setIsAdmin,
    updateFinancialMetrics,
  } = useStore();

  // Check for admin via URL param ?admin=1 (hidden from UI)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get('admin') === '1') setIsAdmin(true);
  }, []);

  useEffect(() => { updateFinancialMetrics(); }, []);

  // All visible tabs for normal users (admin tab only visible if admin)
  const visibleTabs = isAdmin
    ? [...TABS, { key: 'admin' as const, label: 'Аналитика', icon: '⚙️' }]
    : TABS;

  const handleTabClick = (key: string) => {
    setViewingUserId(null);
    setActiveTab(key as Tab); // admin is handled as string cast
  };

  return (
    <div className="app-container" style={{ background: '#0d0f14' }}>
      {/* Top header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)',
        flexShrink: 0, background: '#0d0f14',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>💎</span>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
            Bet<span style={{ color: '#3b82f6' }}>ton</span>
          </span>
        </div>
        <WalletConnect />
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflow: 'hidden', paddingBottom: 'var(--tab-height, 64px)' }}>
        {activeTab === 'bets' && !selectedBetId && <BetsList />}
        {activeTab === 'bets' && selectedBetId && <BetDetail />}
        {activeTab === 'create' && <CreateBet />}
        {activeTab === 'portfolio' && <Portfolio />}
        {activeTab === 'vote' && <PosVoting />}
        {(activeTab as string) === 'admin' && isAdmin && <AdminPanel />}
        {activeTab === 'profile' && (
          viewingUserId && viewingUserId !== currentUser?.id
            ? <Profile />
            : <Profile />
        )}
      </div>

      {/* Bottom navigation */}
      <div
        className="bottom-nav"
        style={{
          position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 760, height: 64,
        }}
      >
        <div style={{ display: 'flex', height: '100%', alignItems: 'center', paddingLeft: 8, paddingRight: 8 }}>
          {visibleTabs.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabClick(tab.key)}
                className={`tab-btn ${isActive ? 'active' : ''}`}
              >
                <span style={{ fontSize: 18, lineHeight: 1, filter: isActive ? 'none' : 'grayscale(0.4) opacity(0.5)' }}>
                  {tab.icon}
                </span>
                <span style={{ fontSize: 10, fontWeight: 600, lineHeight: 1, color: isActive ? '#f1f5f9' : '#475569' }}>
                  {tab.label}
                </span>
                {isActive && (
                  <div style={{ position: 'absolute', top: 2, left: '50%', transform: 'translateX(-50%)', width: 16, height: 2, background: '#3b82f6', borderRadius: 1 }} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
