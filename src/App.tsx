import { useEffect } from 'react';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { useStore } from './store/useStore';
import { CryptoTicker } from './components/CryptoTicker';
import { BetsList } from './components/BetsList';
import { BetDetail } from './components/BetDetail';
import { CreateBet } from './components/CreateBet';
import { Portfolio } from './components/Portfolio';
import { AdminPanel } from './components/AdminPanel';
import { Profile } from './components/Profile';
import { parseTelegramInitData, generateReferralCode } from './security/proofOfStake';
import './index.css';

/**
 * TON Connect Manifest — укажите ваш реальный URL после деплоя
 */
const MANIFEST_URL = 'https://raw.githubusercontent.com/ignat-101/claudebestbetton/main/betton%20claude%20best/tonconnect-manifest.json';

// ════════════════════════════════════════════════════════
//  TABS CONFIG
// ════════════════════════════════════════════════════════
const TABS = [
  { key: 'bets', icon: '🎲', label: 'Ставки' },
  { key: 'create', icon: '➕', label: 'Создать' },
  { key: 'portfolio', icon: '📊', label: 'Портфолио' },
  { key: 'admin', icon: '🛡️', label: 'Админ' },
  { key: 'profile', icon: '👤', label: 'Профиль' },
] as const;

// ════════════════════════════════════════════════════════
//  INNER APP (inside TonConnectUIProvider)
// ════════════════════════════════════════════════════════
function InnerApp() {
  const { activeTab, setActiveTab, selectedBetId, bets, currentUser, setCurrentUser } = useStore();

  // ─────────────────────────────────────────────────────
  //  Telegram initData — безопасная инициализация
  //  isAdmin: ТОЛЬКО из Telegram initData, НИКОГДА из localStorage
  // ─────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const tg = (window as Window & { Telegram?: { WebApp?: {
        initData: string;
        initDataUnsafe?: { user?: { id: number; username?: string; first_name?: string } };
        ready?: () => void;
        expand?: () => void;
      } } }).Telegram;
      const webApp = tg?.WebApp;

      if (webApp) {
        webApp.ready?.();
        webApp.expand?.();

        const initData = webApp.initData;
        const parsed = parseTelegramInitData(initData);

        if (parsed.isValid && parsed.userId) {
          // ⚠️ КРИТИЧНО: isAdmin определяется только по telegramId
          // В production — верифицируйте HMAC на backend
          // ADMIN_TG_IDS — список ID администраторов (задаётся в env)
          const ADMIN_IDS: number[] = [
            // Добавьте ваш Telegram ID сюда для тестирования
            // Например: 123456789
          ];

          const isAdmin = ADMIN_IDS.includes(parsed.userId);
          const userId = `tg_${parsed.userId}`;

          setCurrentUser({
            ...currentUser,
            id: userId,
            telegramId: parsed.userId,
            username: parsed.username ?? `user${parsed.userId}`,
            firstName: parsed.firstName ?? 'TON',
            isAdmin,
            referralCode: generateReferralCode(userId),
          });
        }
      }
    } catch (e) {
      // Не в Telegram — продолжаем без инициализации
      console.warn('Not in Telegram WebApp context');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pendingCount = bets.filter((b) => b.status === 'pending').length;

  // Показываем вкладку Admin только если isAdmin
  const visibleTabs = TABS.filter((t) => t.key !== 'admin' || currentUser.isAdmin);

  return (
    <div
      className="flex flex-col bg-mesh"
      style={{ height: '100dvh', maxWidth: 430, margin: '0 auto', position: 'relative' }}
    >
      {/* Ambient background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-64 h-64 rounded-full opacity-20 animate-float"
          style={{
            background: 'radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 70%)',
            top: '-32px', left: '-32px',
            filter: 'blur(40px)',
          }}
        />
        <div
          className="absolute w-48 h-48 rounded-full opacity-15"
          style={{
            background: 'radial-gradient(circle, rgba(59,130,246,0.4) 0%, transparent 70%)',
            bottom: '80px', right: '-24px',
            filter: 'blur(40px)',
          }}
        />
      </div>

      {/* Crypto ticker */}
      <CryptoTicker />

      {/* Main content */}
      <div className="flex-1 overflow-hidden relative z-10">
        {activeTab === 'bets' && !selectedBetId && <BetsList />}
        {activeTab === 'bets' && selectedBetId && <BetDetail />}
        {activeTab === 'create' && <CreateBet />}
        {activeTab === 'portfolio' && <Portfolio />}
        {activeTab === 'admin' && <AdminPanel />}
        {activeTab === 'profile' && <Profile />}
      </div>

      {/* Bottom tab bar */}
      <div
        className="tab-nav flex-shrink-0 relative z-20"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-stretch">
          {visibleTabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const isPending = tab.key === 'admin' && pendingCount > 0;

            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                }}
                className={`flex-1 flex flex-col items-center justify-center py-2.5 relative transition-all ${
                  isActive ? 'text-white' : 'text-white/30'
                }`}
                style={{ minHeight: 56 }}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-purple-500 rounded-full" />
                )}

                <span
                  className={`text-xl mb-0.5 transition-transform ${isActive ? 'scale-110' : 'scale-100'}`}
                >
                  {tab.icon}
                </span>
                <span className={`text-[9px] font-semibold leading-none ${isActive ? 'text-purple-300' : 'text-white/30'}`}>
                  {tab.label}
                </span>

                {/* Badge for admin pending */}
                {isPending && (
                  <span className="absolute top-1.5 right-[calc(50%-16px)] bg-red-500 text-white text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center">
                    {pendingCount > 9 ? '9+' : pendingCount}
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

// ════════════════════════════════════════════════════════
//  ROOT APP with TON Connect Provider
// ════════════════════════════════════════════════════════
export default function App() {
  return (
    <TonConnectUIProvider manifestUrl={MANIFEST_URL}>
      <InnerApp />
    </TonConnectUIProvider>
  );
}
