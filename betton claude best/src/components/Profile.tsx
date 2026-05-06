import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Copy, CheckCircle, ExternalLink, Bell, BellOff, Star, Shield, Users, Gift } from 'lucide-react';

export function Profile() {
  const { currentUser, setCurrentUser, tonWalletAddress, setTonWalletAddress, treasury } = useStore();
  const [copied, setCopied] = useState(false);
  const [notifEnabled] = useState(true);
  const [showNotifs, setShowNotifs] = useState(false);

  const unreadCount = currentUser.notifications.filter((n) => !n.read).length;

  const copyReferral = () => {
    const link = `https://t.me/FlashBetBot?start=${currentUser.referralCode}`;
    navigator.clipboard?.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnectWallet = () => {
    // Simulate wallet connection
    const mockAddr = 'UQCfdyrb0Fj8lA32OfizTwGY829tTzihsEYl1FrpBzeVKdi0';
    setTonWalletAddress(tonWalletAddress ? null : mockAddr);
  };

  const markAllRead = () => {
    setCurrentUser({
      ...currentUser,
      notifications: currentUser.notifications.map((n) => ({ ...n, read: true })),
    });
  };

  const winRate = currentUser.totalWagered > 0
    ? Math.round((currentUser.totalWon / (currentUser.totalWon + currentUser.totalLost)) * 100)
    : 0;

  const reputationLevel =
    currentUser.reputation >= 1000 ? { label: '💎 Легенда', color: 'text-cyan-400' } :
    currentUser.reputation >= 500 ? { label: '🥇 Про', color: 'text-yellow-400' } :
    currentUser.reputation >= 200 ? { label: '🥈 Опытный', color: 'text-gray-400' } :
    { label: '🥉 Новичок', color: 'text-orange-400' };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black text-white">Профиль</h1>
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative glass p-2.5 rounded-xl"
          >
            {notifEnabled ? <Bell size={18} className="text-white/60" /> : <BellOff size={18} className="text-white/30" />}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scroll-content px-4 pb-4">
        {/* Notifications panel */}
        {showNotifs && (
          <div className="glass-card p-4 mb-4 border border-purple-500/20 animate-fadeIn">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-white/70">Уведомления</p>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-[10px] text-purple-400">Прочитать все</button>
              )}
            </div>
            {currentUser.notifications.map((n) => (
              <div key={n.id} className={`py-2.5 border-b border-white/5 last:border-0 ${!n.read ? 'opacity-100' : 'opacity-50'}`}>
                <div className="flex items-start gap-2">
                  <span className="text-sm mt-0.5">{n.type === 'win' ? '🎉' : n.type === 'vote_reward' ? '🗳' : n.type === 'referral' ? '👥' : '🔔'}</span>
                  <div>
                    <p className="text-xs font-bold text-white">{n.title}</p>
                    <p className="text-[11px] text-white/50">{n.message}</p>
                  </div>
                  {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 flex-shrink-0 ml-auto" />}
                </div>
              </div>
            ))}
            {currentUser.notifications.length === 0 && (
              <p className="text-xs text-white/30 text-center py-4">Нет уведомлений</p>
            )}
          </div>
        )}

        {/* User card */}
        <div className="glass-card p-5 mb-4 border border-purple-500/20 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-purple-500/10 blur-2xl" />

          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-3xl shadow-lg shadow-purple-500/30">
              {currentUser.avatar}
            </div>
            <div>
              <h2 className="text-lg font-black text-white">{currentUser.firstName} {currentUser.lastName}</h2>
              <p className="text-sm text-white/50">@{currentUser.username}</p>
              <p className={`text-xs font-bold mt-1 ${reputationLevel.color}`}>{reputationLevel.label}</p>
            </div>
          </div>

          {/* Balances */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="glass rounded-xl p-3 text-center glow-gold">
              <div className="text-xl font-black text-yellow-400">{currentUser.starsBalance.toLocaleString()} ⭐</div>
              <div className="text-[10px] text-white/40 mt-0.5">Stars баланс</div>
            </div>
            <div className="glass rounded-xl p-3 text-center glow-blue">
              <div className="text-xl font-black text-blue-400">{currentUser.tonBalance} TON</div>
              <div className="text-[10px] text-white/40 mt-0.5">TON баланс</div>
            </div>
          </div>

          {/* Admin badge */}
          {currentUser.isAdmin && (
            <div className="flex items-center gap-2 glass rounded-xl px-3 py-2 border border-purple-500/30">
              <Shield size={14} className="text-purple-400" />
              <span className="text-xs font-bold text-purple-300">Администратор платформы</span>
            </div>
          )}
        </div>

        {/* TON Wallet */}
        <div className="glass-card p-4 mb-4 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <span className="text-sm">💎</span>
            </div>
            <div>
              <p className="text-xs font-bold text-white">TON Connect</p>
              <p className="text-[10px] text-white/40">Подключите TON кошелёк</p>
            </div>
            <div className="ml-auto">
              <div className={`w-2 h-2 rounded-full ${tonWalletAddress ? 'bg-emerald-400' : 'bg-white/20'}`} />
            </div>
          </div>

          {tonWalletAddress ? (
            <div>
              <div className="glass rounded-xl p-3 mb-3 border border-emerald-500/20">
                <p className="text-[10px] text-emerald-400 font-bold mb-1">Подключён</p>
                <p className="text-xs text-white/60 font-mono break-all">{tonWalletAddress}</p>
              </div>
              <button
                onClick={handleConnectWallet}
                className="w-full py-2.5 rounded-xl text-sm font-semibold border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all"
              >
                Отключить кошелёк
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnectWallet}
              className="btn-primary w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2"
            >
              <ExternalLink size={16} />
              Подключить TON Wallet
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="glass-card p-4 mb-4">
          <p className="text-xs font-bold text-white/60 mb-3">Статистика</p>
          <div className="space-y-3">
            {[
              { label: 'Всего ставок', value: `${currentUser.activeBets.length + currentUser.resolvedBets.length}`, color: 'text-white' },
              { label: 'Победных ставок', value: `${winRate}%`, color: 'text-emerald-400' },
              { label: 'Репутация', value: `${currentUser.reputation} очков`, color: 'text-purple-400' },
              { label: 'Проголосовал', value: `${currentUser.votedBets.length} раз`, color: 'text-blue-400' },
              { label: 'Рефералов', value: `${currentUser.referrals.length}`, color: 'text-yellow-400' },
              { label: 'Заработано на рефералах', value: `${currentUser.referralEarnings} ⭐`, color: 'text-yellow-400' },
            ].map((stat) => (
              <div key={stat.label} className="flex justify-between items-center">
                <span className="text-xs text-white/40">{stat.label}</span>
                <span className={`text-xs font-bold ${stat.color}`}>{stat.value}</span>
              </div>
            ))}
          </div>

          {/* Progress to next level */}
          <div className="mt-4 pt-3 border-t border-white/5">
            <div className="flex justify-between text-[10px] text-white/40 mb-1.5">
              <span>Прогресс репутации</span>
              <span>{currentUser.reputation}/1000</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                style={{ width: `${Math.min(100, (currentUser.reputation / 1000) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Referral */}
        <div className="glass-card p-4 mb-4 border border-yellow-500/20">
          <div className="flex items-center gap-2 mb-3">
            <Gift size={16} className="text-yellow-400" />
            <p className="text-xs font-bold text-yellow-300">Реферальная программа</p>
          </div>
          <p className="text-xs text-white/50 mb-3">
            Приглашай друзей и получай <span className="text-yellow-400 font-bold">1% от их ставок</span> пожизненно!
          </p>

          <div className="glass rounded-xl p-3 mb-3 border border-yellow-500/20">
            <p className="text-[10px] text-yellow-400/70 mb-1">Ваш реферальный код</p>
            <p className="text-sm font-black text-yellow-400">{currentUser.referralCode}</p>
            <p className="text-[10px] text-white/30 mt-1 font-mono">t.me/FlashBetBot?start={currentUser.referralCode}</p>
          </div>

          <button
            onClick={copyReferral}
            className={`w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              copied
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                : 'glass border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10'
            }`}
          >
            {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
            {copied ? 'Скопировано!' : 'Скопировать ссылку'}
          </button>

          <div className="flex items-center gap-3 mt-3">
            <Users size={14} className="text-white/30" />
            <div className="text-xs text-white/40">
              {currentUser.referrals.length} рефералов · Заработано: <span className="text-yellow-400 font-bold">{currentUser.referralEarnings} ⭐</span>
            </div>
          </div>
        </div>

        {/* Treasury transparency */}
        <div className="glass-card p-4 mb-4 border border-emerald-500/20">
          <div className="flex items-center gap-2 mb-3">
            <Star size={14} className="text-emerald-400" />
            <p className="text-xs font-bold text-emerald-300">Прозрачная казна</p>
          </div>
          <p className="text-xs text-white/50 mb-3">Баланс и транзакции платформы открыты для всех</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="glass rounded-xl p-2 text-center">
              <div className="text-sm font-black text-yellow-400">{(treasury.totalBalance / 1000).toFixed(0)}K</div>
              <div className="text-[9px] text-white/30">Баланс ⭐</div>
            </div>
            <div className="glass rounded-xl p-2 text-center">
              <div className="text-sm font-black text-purple-400">{(treasury.totalFees / 1000).toFixed(1)}K</div>
              <div className="text-[9px] text-white/30">Комиссии ⭐</div>
            </div>
            <div className="glass rounded-xl p-2 text-center">
              <div className="text-sm font-black text-emerald-400">{(treasury.totalPaidOut / 1000).toFixed(0)}K</div>
              <div className="text-[9px] text-white/30">Выплачено ⭐</div>
            </div>
          </div>
          <p className="text-[10px] text-white/30 mt-3 font-mono break-all">
            Кошелёк: UQCfdyrb0Fj8...Kdi0
          </p>
        </div>

        {/* Version */}
        <div className="text-center py-4">
          <p className="text-[10px] text-white/20">TON FlashBet v1.0.0 · Powered by TON & Telegram Stars</p>
        </div>
      </div>
    </div>
  );
}
