import { useStore } from '../store/useStore';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

export function Profile() {
  const { currentUser, bets, tonWalletAddress, users, setViewingUserId, setActiveTab } = useStore();

  if (!tonWalletAddress || !currentUser) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>👤</div>
        <h2 style={{ color: '#f1f5f9', marginBottom: 8 }}>Нет подключения</h2>
        <p style={{ color: '#64748b', fontSize: 13, textAlign: 'center' }}>
          Подключите TON кошелёк для просмотра профиля
        </p>
      </div>
    );
  }

  const myBets = bets.flatMap(b => b.participants.filter(p => p.userId === currentUser.id).map(p => ({ ...p, bet: b })));
  const totalVolume = myBets.reduce((s, p) => s + p.amount, 0);
  const totalPnl = myBets.reduce((s, p) => s + (p.pnl ?? 0), 0);
  const wins = myBets.filter(p => (p.pnl ?? 0) > 0).length;
  const winRate = myBets.length > 0 ? Math.round((wins / myBets.length) * 100) : 0;

  const myPosVotes = bets.flatMap(b => b.posVotes.filter(v => v.userId === currentUser.id));
  const totalStaked = myPosVotes.reduce((s, v) => s + v.stake, 0);

  // Leaderboard among all users
  const leaderboard = users
    .map(u => ({
      ...u,
      calcVolume: bets.flatMap(b => b.participants.filter(p => p.userId === u.id)).reduce((s, p) => s + p.amount, 0),
    }))
    .sort((a, b) => b.calcVolume - a.calcVolume)
    .slice(0, 10);

  const myRank = leaderboard.findIndex(u => u.id === currentUser.id) + 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '16px 16px 12px', flexShrink: 0 }}>
        <h1 style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9', margin: '0 0 12px' }}>Профиль</h1>
      </div>

      <div className="scroll-area" style={{ flex: 1, padding: '0 16px 16px' }}>
        {/* Avatar & info */}
        <div className="glass-card" style={{ padding: 16, marginBottom: 12, display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(59,130,246,0.15)', border: '2px solid rgba(59,130,246,0.3)',
            fontSize: 28,
          }}>
            {currentUser.avatarEmoji}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 2 }}>
              {currentUser.username}
            </div>
            <div style={{ fontSize: 11, color: '#475569', marginBottom: 6, fontFamily: 'monospace' }}>
              {tonWalletAddress.slice(0, 8)}…{tonWalletAddress.slice(-8)}
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {currentUser.badges.map((b, i) => (
                <span key={i} style={{ fontSize: 14 }}>{b}</span>
              ))}
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 11, color: '#64748b' }}>
            <div>Регистрация</div>
            <div>{formatDistanceToNow(currentUser.joinedAt, { locale: ru, addSuffix: true })}</div>
            {myRank > 0 && (
              <div style={{ marginTop: 4, color: '#f59e0b', fontWeight: 700 }}>#{myRank} в рейтинге</div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
          {[
            { label: 'Ставок',   value: myBets.length,                     color: '#60a5fa' },
            { label: 'Объём',    value: totalVolume.toFixed(1) + ' TON',    color: '#f1f5f9' },
            { label: 'P&L',      value: (totalPnl >= 0 ? '+' : '') + totalPnl.toFixed(2) + ' TON', color: totalPnl >= 0 ? '#22c55e' : '#ef4444' },
            { label: 'Винрейт',  value: winRate + '%',                       color: '#22c55e' },
            { label: 'Репутация', value: currentUser.reputation,             color: '#a855f7' },
            { label: 'PoS стейк', value: totalStaked.toFixed(1) + ' TON',   color: '#c084fc' },
          ].map(s => (
            <div key={s.label} className="glass-card" style={{ padding: '10px 12px' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: '#475569' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Wallet info */}
        <div className="glass-card" style={{ padding: 12, marginBottom: 12 }}>
          <div className="section-label" style={{ marginBottom: 8 }}>💎 Кошелёк TON</div>
          <div style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace', wordBreak: 'break-all' }}>
            {tonWalletAddress}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="section-label" style={{ marginBottom: 8 }}>🏆 Топ трейдеров</div>
        {leaderboard.length === 0 ? (
          <div style={{ color: '#475569', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
            Рейтинг формируется по мере торговли
          </div>
        ) : (
          leaderboard.map((u, i) => (
            <div key={u.id} className={i < 3 ? 'market-card' : 'glass-card'}
              style={{ padding: '10px 14px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 12,
                       cursor: u.id !== currentUser.id ? 'pointer' : 'default' }}
              onClick={() => u.id !== currentUser.id && (setViewingUserId(u.id), setActiveTab('profile'))}
            >
              <div style={{ fontSize: 16, width: 24, textAlign: 'center', flexShrink: 0 }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
              </div>
              <div style={{ fontSize: 20, flexShrink: 0 }}>{u.avatarEmoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: u.id === currentUser.id ? '#60a5fa' : '#f1f5f9' }}>
                  {u.username} {u.id === currentUser.id ? '(вы)' : ''}
                </div>
                <div style={{ fontSize: 10, color: '#475569' }}>Репутация: {u.reputation}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>{u.calcVolume.toFixed(1)}</div>
                <div style={{ fontSize: 10, color: '#475569' }}>TON</div>
              </div>
            </div>
          ))
        )}

        {/* Security info */}
        <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.1)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#60a5fa', marginBottom: 4 }}>🔐 Безопасность</div>
          <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.6 }}>
            <div>✓ Регистрация только по TON кошельку</div>
            <div>✓ Нет централизованного хранения паролей</div>
            <div>✓ PoS консенсус для разрешения споров</div>
            <div>✓ AMM ценообразование без возможности манипуляций</div>
            <div>✓ Публичная история транзакций</div>
          </div>
        </div>
      </div>
    </div>
  );
}
