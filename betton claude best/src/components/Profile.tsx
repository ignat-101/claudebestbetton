import { useTonConnectUI, useTonWallet, TonConnectButton, useTonAddress } from '@tonconnect/ui-react';
import { useStore } from '../store/useStore';

export function Profile() {
  const { currentUser, transactions, tonWalletAddress } = useStore();
  const wallet = useTonWallet();
  const friendlyAddress = useTonAddress(true);
  const rawAddress = useTonAddress(false);
  const [tonConnectUI] = useTonConnectUI();

  const unreadCount = currentUser.notifications.filter((n) => !n.read).length;
  const totalBets = currentUser.activeBets.length + currentUser.resolvedBets.length;
  const recentTxs = transactions.slice(0, 5);

  const reputationLevel = currentUser.reputation >= 1000
    ? { label: '💎 Легенда', color: 'text-yellow-400' }
    : currentUser.reputation >= 500
    ? { label: '🥇 Эксперт', color: 'text-purple-400' }
    : currentUser.reputation >= 200
    ? { label: '🥈 Ветеран', color: 'text-blue-400' }
    : { label: '🥉 Новичок', color: 'text-white/50' };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 px-4 pt-4 pb-3">
        <h1 className="text-xl font-black text-white">👤 Профиль</h1>
      </div>

      <div className="flex-1 overflow-y-auto scroll-content px-4 pb-6 space-y-3">
        {/* User card */}
        <div className="glass-card p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-purple-500/10 -mr-8 -mt-8" />
          <div className="flex items-center gap-4 mb-3 relative">
            <div className="text-5xl">{currentUser.avatar}</div>
            <div>
              <div className="text-lg font-black text-white">{currentUser.firstName} {currentUser.lastName}</div>
              <div className="text-sm text-white/50">@{currentUser.username}</div>
              <div className={`text-xs font-bold mt-0.5 ${reputationLevel.color}`}>{reputationLevel.label}</div>
            </div>
          </div>
          {currentUser.isAdmin && (
            <div className="flex items-center gap-2 glass-card px-3 py-2 rounded-xl border border-purple-500/30">
              <span>🛡️</span>
              <span className="text-xs font-bold text-purple-300">Администратор платформы</span>
            </div>
          )}
        </div>

        {/* TON Wallet - real connect */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-[#0098EA] text-xl">💎</span>
              <div>
                <div className="text-sm font-bold text-white">TON Кошелёк</div>
                <div className="text-[10px] text-white/40">Реальные транзакции в блокчейн</div>
              </div>
            </div>
          </div>

          {wallet ? (
            <div className="space-y-2">
              <div className="glass-card p-3 rounded-xl border border-emerald-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse-glow" />
                  <span className="text-xs font-bold text-emerald-400">Подключён</span>
                  <span className="text-[10px] text-white/30 ml-1">{wallet.device.appName}</span>
                </div>
                <div className="font-mono text-[10px] text-white/60 break-all">
                  {friendlyAddress || rawAddress || tonWalletAddress}
                </div>
              </div>
              <button
                onClick={() => tonConnectUI.disconnect()}
                className="w-full py-2 rounded-xl glass-input text-red-400 text-xs font-bold border border-red-500/20"
              >
                Отключить кошелёк
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-[10px] text-white/40 mb-2">
                Подключите TON кошелёк чтобы делать реальные ставки в блокчейне TON
              </div>
              <TonConnectButton style={{ width: '100%' }} />
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="glass-card p-4">
          <div className="text-xs font-bold text-white/60 mb-3">📊 Статистика</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Всего ставок', value: totalBets, color: 'text-white' },
              { label: 'Активных', value: currentUser.activeBets.length, color: 'text-emerald-400' },
              { label: 'Поставлено TON', value: `${currentUser.totalWagered.toFixed(2)} 💎`, color: 'text-[#0098EA]' },
              { label: 'Выиграно TON', value: `${currentUser.totalWon.toFixed(2)} 💎`, color: 'text-emerald-400' },
              { label: 'Репутация', value: `${currentUser.reputation} очков`, color: 'text-purple-400' },
              { label: 'Голосований', value: currentUser.votedBets.length, color: 'text-blue-400' },
            ].map((stat) => (
              <div key={stat.label} className="glass-card p-2.5 rounded-xl">
                <div className="text-[10px] text-white/40">{stat.label}</div>
                <div className={`text-sm font-bold mt-0.5 ${stat.color}`}>{stat.value}</div>
              </div>
            ))}
          </div>

          <div className="mt-3">
            <div className="flex justify-between text-[10px] text-white/40 mb-1">
              <span>Прогресс репутации</span>
              <span>{currentUser.reputation}/1000</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                style={{ width: `${Math.min(100, (currentUser.reputation / 1000) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Notifications */}
        {currentUser.notifications.length > 0 && (
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-bold text-white/60">🔔 Уведомления</span>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="space-y-2">
              {currentUser.notifications.slice(0, 6).map((n) => (
                <div key={n.id} className={`glass-card p-2.5 rounded-xl ${!n.read ? 'border border-purple-500/20' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">{n.title}</div>
                      <div className="text-[10px] text-white/50 mt-0.5">{n.message}</div>
                    </div>
                    {!n.read && <span className="w-2 h-2 bg-purple-400 rounded-full flex-shrink-0 mt-1" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Referral */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <span>👥</span>
            <span className="text-sm font-bold text-white">Реферальная программа</span>
          </div>
          <div className="text-[10px] text-white/40 mb-3">Приглашай друзей и получай 1% от их ставок!</div>
          <div className="glass-card p-2.5 rounded-xl mb-2">
            <div className="text-[10px] text-white/40 mb-1">Ваш код</div>
            <div className="text-sm font-bold text-white font-mono">{currentUser.referralCode}</div>
          </div>
          <div className="text-[10px] text-white/30">
            {currentUser.referrals.length} рефералов · {currentUser.referralEarnings.toFixed(3)} TON заработано
          </div>
        </div>

        {/* Transparency */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <span>🔍</span>
            <span className="text-sm font-bold text-white">Прозрачность казны</span>
          </div>
          <div className="text-[10px] text-white/40 mb-2">Все транзакции в блокчейне TON — публичны</div>
          <a
            href={`https://tonviewer.com/UQCfdyrb0Fj8lA32OfizTwGY829tTzihsEYl1FrpBzeVKdi0`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[10px] text-[#0098EA] underline"
          >
            <span>💎</span>
            UQCfdyrb0Fj8...Kdi0 — смотреть на TONViewer ↗
          </a>
        </div>

        <div className="text-center text-[10px] text-white/20 py-2">
          TON FlashBet v2.0 · Powered by TON Blockchain
        </div>
      </div>
    </div>
  );
}
