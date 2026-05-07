import { useState } from 'react';
import { useStore, RANK_META, computeRank, DEMO_USERS } from '../store/useStore';
import { SECURITY_CONFIG } from '../security/proofOfStake';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Props {
  /** If set, show this user's PUBLIC profile (read-only). Null = own profile. */
  userId?: string | null;
}

export function Profile({ userId }: Props) {
  const { currentUser, setCurrentUser, bets, linkTonDomain, unlinkTonDomain, setViewingUserId, setActiveTab } = useStore();

  // Resolve which user to display
  const isOwnProfile = !userId || userId === currentUser.id;
  const demoUser = DEMO_USERS.find(u => u.id === userId);
  const viewUser = isOwnProfile ? currentUser : (demoUser ? { ...demoUser, isAdmin: false, notifications: [] } : null);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ username: currentUser.username, bio: currentUser.bio ?? '', avatar: currentUser.avatar });
  const [domainInput, setDomainInput] = useState('');
  const [domainError, setDomainError] = useState('');
  const [domainSuccess, setDomainSuccess] = useState('');
  const [showDomainForm, setShowDomainForm] = useState(false);

  if (!viewUser) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white/40">
        <div className="text-4xl mb-3">👤</div>
        <p>Пользователь не найден</p>
      </div>
    );
  }

  const rank = computeRank(viewUser.reputation);
  const rankMeta = RANK_META[rank];
  const myBets = isOwnProfile
    ? bets.filter(b => b.participants.some(p => p.userId === viewUser.id))
    : bets.filter(b => viewUser.profilePublic && b.participants.some(p => p.userId === viewUser.id));

  const recentBets = myBets.slice(0, 5);
  const roi = viewUser.totalWagered > 0
    ? ((viewUser.totalWon - viewUser.totalWagered) / viewUser.totalWagered * 100).toFixed(1)
    : '0.0';
  const roiPos = parseFloat(roi) >= 0;
  const unreadCount = isOwnProfile ? currentUser.notifications.filter(n => !n.read).length : 0;

  const saveEdit = () => {
    setCurrentUser({
      ...currentUser,
      username: draft.username.slice(0, 24) || currentUser.username,
      bio: draft.bio.slice(0, 120),
      avatar: draft.avatar,
    });
    setEditing(false);
  };

  const handleLinkDomain = () => {
    setDomainError('');
    setDomainSuccess('');
    const result = linkTonDomain(domainInput);
    if (result.ok) {
      setDomainSuccess(`✅ ${domainInput} привязан! Верификация через TON DNS займёт ~5 мин.`);
      setDomainInput('');
      setTimeout(() => { setDomainSuccess(''); setShowDomainForm(false); }, 3000);
    } else {
      setDomainError(result.error ?? 'Ошибка');
    }
  };

  const AVATARS = ['🎯', '🐺', '🐳', '🧙', '🌙', '⚔️', '🦊', '🦁', '🐉', '🤖', '👾', '🎭'];

  return (
    <div className="flex flex-col h-full bg-mesh">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-4 pb-2">
        {!isOwnProfile && (
          <button onClick={() => { setViewingUserId(null); setActiveTab('leaderboard'); }}
            className="flex items-center gap-1.5 text-white/50 text-[12px] mb-3 hover:text-white transition-colors">
            ← Назад
          </button>
        )}
        <h1 className="text-xl font-black text-white">{isOwnProfile ? 'Профиль' : `@${viewUser.username}`}</h1>
      </div>

      <div className="flex-1 overflow-y-auto scroll-content px-4 pb-4 space-y-3">
        {/* Avatar & Info */}
        <div className="glass-card p-4 rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center text-3xl avatar-ring">
                {viewUser.avatar}
              </div>
              <div className={`absolute -bottom-1 -right-1 text-xs px-1 py-0.5 rounded-full font-bold ${rankMeta.color} bg-black/60`}>
                {rankMeta.emoji}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-black text-white">@{viewUser.username}</h2>
                {viewUser.tonDomains.map(d => (
                  <span key={d.domain} className="ton-domain-badge">
                    💎 {d.domain}
                    {d.verified && <span className="text-emerald-400 text-[9px]">✓</span>}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[11px] font-semibold ${rankMeta.color}`}>{rankMeta.emoji} {rankMeta.label}</span>
                <span className="text-white/20">·</span>
                <span className="text-[11px] text-white/40">Rep: {viewUser.reputation}</span>
              </div>
              {viewUser.bio && (
                <p className="text-[11px] text-white/50 mt-1 line-clamp-2">{viewUser.bio}</p>
              )}
              <p className="text-[10px] text-white/25 mt-1">
                Участник {formatDistanceToNow(viewUser.joinedAt, { locale: ru, addSuffix: true })}
              </p>
            </div>
          </div>

          {/* Win streak */}
          {viewUser.winStreak > 0 && (
            <div className="mt-3 glass px-3 py-2 rounded-xl flex items-center justify-between">
              <span className="text-[11px] text-white/50">🔥 Серия побед</span>
              <span className="text-[12px] font-black text-amber-400">{viewUser.winStreak} подряд</span>
            </div>
          )}

          {/* Edit / Actions */}
          {isOwnProfile && !editing && (
            <button onClick={() => setEditing(true)}
              className="mt-3 w-full glass text-white/60 text-[11px] py-2 rounded-xl hover:text-white transition-colors font-semibold">
              ✏️ Редактировать профиль
            </button>
          )}
          {isOwnProfile && editing && (
            <div className="mt-3 space-y-2 animate-fadeIn">
              <div>
                <p className="text-[10px] text-white/40 mb-1">Аватар</p>
                <div className="flex flex-wrap gap-2">
                  {AVATARS.map(a => (
                    <button key={a} onClick={() => setDraft(d => ({ ...d, avatar: a }))}
                      className={`text-xl w-9 h-9 rounded-xl transition-all ${draft.avatar === a ? 'bg-purple-500/30 ring-1 ring-purple-400' : 'glass hover:bg-white/10'}`}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              <input className="glass-input w-full rounded-xl px-3 py-2 text-[12px]" placeholder="Username"
                value={draft.username} onChange={e => setDraft(d => ({ ...d, username: e.target.value }))} />
              <textarea className="glass-input w-full rounded-xl px-3 py-2 text-[12px] resize-none" rows={2} placeholder="Биография (до 120 символов)"
                value={draft.bio} onChange={e => setDraft(d => ({ ...d, bio: e.target.value.slice(0, 120) }))} />
              <div className="flex gap-2">
                <button onClick={saveEdit} className="btn-primary flex-1 text-white text-[12px] font-bold py-2 rounded-xl">Сохранить</button>
                <button onClick={() => setEditing(false)} className="glass flex-1 text-white/50 text-[12px] py-2 rounded-xl">Отмена</button>
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Поставлено', value: `${viewUser.totalWagered.toFixed(1)}`, unit: 'TON', color: 'text-white' },
            { label: 'Выиграно', value: `${viewUser.totalWon.toFixed(1)}`, unit: 'TON', color: 'text-emerald-400' },
            { label: 'ROI', value: `${roiPos ? '+' : ''}${roi}`, unit: '%', color: roiPos ? 'text-emerald-400' : 'text-red-400' },
          ].map(s => (
            <div key={s.label} className="glass-card p-3 rounded-xl text-center">
              <p className="text-[9px] text-white/35 mb-1">{s.label}</p>
              <p className={`text-[15px] font-black ${s.color}`}>{s.value}<span className="text-[10px] ml-0.5 opacity-60">{s.unit}</span></p>
            </div>
          ))}
        </div>

        {/* Reputation bar */}
        <div className="glass-card p-3 rounded-xl">
          <div className="flex justify-between text-[11px] mb-2">
            <span className="text-white/40">Репутация</span>
            <span className={rankMeta.color}>{rankMeta.emoji} {rankMeta.label} · {viewUser.reputation}/1000</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, viewUser.reputation / 10)}%` }} />
          </div>
          <div className="flex justify-between text-[9px] text-white/25 mt-1">
            <span>Новичок</span><span>Игрок</span><span>Эксперт</span><span>Легенда</span><span>Кит</span>
          </div>
        </div>

        {/* TON Domains — own profile only */}
        {isOwnProfile && (
          <div className="glass-card p-3 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] font-bold text-white">💎 TON Домены</span>
              <button onClick={() => setShowDomainForm(f => !f)}
                className="text-[10px] text-blue-400 hover:text-blue-300">
                {showDomainForm ? 'Скрыть' : '+ Привязать'}
              </button>
            </div>
            {currentUser.tonDomains.length === 0 && !showDomainForm && (
              <p className="text-[11px] text-white/30">Нет привязанных доменов. Привяжи свой .ton домен!</p>
            )}
            {currentUser.tonDomains.map(d => (
              <div key={d.domain} className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="ton-domain-badge">💎 {d.domain}</span>
                  {d.verified
                    ? <span className="text-[10px] text-emerald-400">✓ Верифицирован</span>
                    : <span className="text-[10px] text-amber-400">⏳ Ожидание</span>}
                </div>
                <button onClick={() => unlinkTonDomain(d.domain)}
                  className="text-[10px] text-red-400/60 hover:text-red-400">✕</button>
              </div>
            ))}
            {showDomainForm && (
              <div className="mt-2 space-y-2 animate-fadeIn">
                <input className="glass-input w-full rounded-xl px-3 py-2 text-[12px]"
                  placeholder="example.ton"
                  value={domainInput}
                  onChange={e => setDomainInput(e.target.value)} />
                {domainError && <p className="text-[10px] text-red-400">{domainError}</p>}
                {domainSuccess && <p className="text-[10px] text-emerald-400">{domainSuccess}</p>}
                <button onClick={handleLinkDomain}
                  className="btn-primary w-full text-white text-[12px] font-bold py-2 rounded-xl">
                  Привязать домен
                </button>
                <p className="text-[9px] text-white/25 text-center">
                  Для верификации: добавьте TXT-запись flashbet-verify в DNS вашего домена
                </p>
              </div>
            )}
          </div>
        )}

        {/* Public bet history */}
        {(isOwnProfile || viewUser.profilePublic) && recentBets.length > 0 && (
          <div>
            <p className="text-[10px] text-white/30 font-semibold uppercase tracking-wider mb-2">
              {isOwnProfile ? '🎯 Мои ставки' : '🎯 Публичные ставки'}
            </p>
            {recentBets.map(b => {
              const userBet = b.participants.find(p => p.userId === viewUser.id);
              const won = b.outcome && userBet?.side === b.outcome;
              return (
                <div key={b.id} className="glass-card px-3 py-2.5 rounded-xl mb-2">
                  <p className="text-[12px] font-semibold text-white line-clamp-1 mb-1">{b.title}</p>
                  <div className="flex justify-between text-[10px]">
                    <span className={userBet?.side === 'yes' ? 'text-emerald-400' : 'text-red-400'}>
                      {userBet?.side === 'yes' ? 'ДА' : 'НЕТ'} · {userBet?.amount} TON
                    </span>
                    <span className={b.status === 'resolved' ? (won ? 'text-emerald-400' : 'text-red-400') : 'text-white/30'}>
                      {b.status === 'resolved' ? (won ? '🏆 Победа' : '😔 Проигрыш') : '⏳ Активна'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!isOwnProfile && !viewUser.profilePublic && (
          <div className="glass-card p-4 rounded-xl text-center text-white/40 text-sm">
            🔒 Этот профиль приватный
          </div>
        )}

        {/* Notifications — own profile only */}
        {isOwnProfile && currentUser.notifications.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-white/30 font-semibold uppercase tracking-wider">
                🔔 Уведомления {unreadCount > 0 && <span className="ml-1 bg-red-500 text-white text-[9px] px-1 rounded-full">{unreadCount}</span>}
              </p>
            </div>
            {currentUser.notifications.slice(0, 6).map(n => (
              <div key={n.id} className="glass-card px-3 py-2.5 rounded-xl mb-1.5 flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-white">{n.title}</p>
                  <p className="text-[10px] text-white/50 mt-0.5">{n.message}</p>
                  <p className="text-[9px] text-white/25 mt-0.5">{formatDistanceToNow(n.timestamp, { locale: ru, addSuffix: true })}</p>
                </div>
                {!n.read && <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1 flex-shrink-0" />}
              </div>
            ))}
          </div>
        )}

        {/* Referral — own profile only */}
        {isOwnProfile && (
          <div className="glass-card p-4 rounded-xl">
            <p className="text-[12px] font-bold text-white mb-2">👥 Реферальная программа</p>
            <p className="text-[11px] text-white/50 mb-3">
              Приглашай друзей и получай {SECURITY_CONFIG.REFERRAL_PCT * 100}% от их ставок автоматически
            </p>
            <div className="glass px-3 py-2 rounded-xl flex items-center justify-between">
              <span className="text-[11px] text-white/40">Ваш код</span>
              <span className="text-[13px] font-black text-purple-400 tracking-wider">{currentUser.referralCode}</span>
            </div>
            <div className="flex justify-between text-[11px] text-white/40 mt-2">
              <span>{currentUser.referrals.length} рефералов</span>
              <span className="text-emerald-400">{currentUser.referralEarnings.toFixed(3)} TON заработано</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
