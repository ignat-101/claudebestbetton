import { useStore } from '../store/useStore';
import { computePosResult } from '../security/proofOfStake';

// Admin panel — only shown to admins, completely hidden from normal users
export function AdminPanel() {
  const { bets, users, isAdmin } = useStore();

  if (!isAdmin) return null;

  const totalVolume = bets.reduce((s, b) => s + b.totalVolume, 0);
  const activeBets = bets.filter(b => b.status === 'active').length;
  const resolvedBets = bets.filter(b => b.status === 'resolved').length;
  const totalUsers = users.length;
  const totalStaked = bets.flatMap(b => b.posVotes).reduce((s, v) => s + v.stake, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '16px 16px 12px', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <h1 style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9', margin: 0 }}>⚙️ Аналитика</h1>
        <p style={{ fontSize: 12, color: '#475569', margin: '3px 0 0' }}>Данные платформы в реальном времени</p>
      </div>

      <div className="scroll-area" style={{ flex: 1, padding: '12px 16px 16px' }}>
        {/* Overview stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 16 }}>
          {[
            { label: 'Общий объём', value: totalVolume.toFixed(2) + ' TON', color: '#60a5fa' },
            { label: 'Пользователей', value: totalUsers, color: '#22c55e' },
            { label: 'Активных', value: activeBets, color: '#f59e0b' },
            { label: 'Завершённых', value: resolvedBets, color: '#a855f7' },
            { label: 'Всего событий', value: bets.length, color: '#f1f5f9' },
            { label: 'Стейк PoS', value: totalStaked.toFixed(2) + ' TON', color: '#c084fc' },
          ].map(s => (
            <div key={s.label} className="glass-card" style={{ padding: '10px 12px' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: '#475569' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Fee estimate */}
        <div className="glass-card" style={{ padding: 12, marginBottom: 12 }}>
          <div className="section-label" style={{ marginBottom: 8 }}>💰 Доход платформы</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: '#64748b' }}>Комиссии (5%)</span>
            <span style={{ color: '#22c55e', fontWeight: 700 }}>{(totalVolume * 0.05).toFixed(2)} TON</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 4 }}>
            <span style={{ color: '#64748b' }}>Валидаторам (2%)</span>
            <span style={{ color: '#a855f7', fontWeight: 700 }}>{(totalVolume * 0.02).toFixed(2)} TON</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 4 }}>
            <span style={{ color: '#64748b' }}>Чистый доход (3%)</span>
            <span style={{ color: '#f1f5f9', fontWeight: 700 }}>{(totalVolume * 0.03).toFixed(2)} TON</span>
          </div>
        </div>

        {/* All bets with PoS status */}
        <div className="section-label" style={{ marginBottom: 8 }}>Все события</div>
        {bets.map(bet => {
          const pr = bet.posVotes.length > 0
            ? computePosResult(bet.posVotes.map(v => ({
                userId: v.userId, username: v.username, choice: v.choice,
                stake: v.stake, reputation: v.reputation, timestamp: v.timestamp,
                stakeAge: v.stakeAge, confidence: v.confidence,
              })))
            : null;

          return (
            <div key={bet.id} className="market-card" style={{ padding: 12, marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9', flex: 1, lineHeight: 1.3 }}>{bet.title}</div>
                <span style={{ marginLeft: 8, fontSize: 10, padding: '2px 6px', borderRadius: 4,
                  background: bet.status === 'active' ? 'rgba(34,197,94,0.15)' : bet.status === 'resolved' ? 'rgba(100,116,139,0.2)' : 'rgba(168,85,247,0.15)',
                  color: bet.status === 'active' ? '#22c55e' : bet.status === 'resolved' ? '#94a3b8' : '#a855f7',
                }}>
                  {bet.status}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 10, fontSize: 11, color: '#64748b', flexWrap: 'wrap' }}>
                <span>📊 {bet.totalVolume.toFixed(2)} TON</span>
                <span>👥 {bet.participants.length} уч.</span>
                <span>🗳 {bet.posVotes.length} голосов</span>
                {pr && <span style={{ color: pr.quorumReached ? '#22c55e' : '#f59e0b' }}>
                  {pr.quorumReached ? '✓ Кворум' : '⏳ Нет кворума'}
                </span>}
                {bet.resolvedOutcome && (
                  <span style={{ color: bet.resolvedOutcome === 'yes' ? '#22c55e' : '#ef4444' }}>
                    → {bet.resolvedOutcome === 'yes' ? 'ДА' : 'НЕТ'}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* Users */}
        <div className="section-label" style={{ marginBottom: 8, marginTop: 16 }}>Пользователи ({users.length})</div>
        {users.map(u => (
          <div key={u.id} className="glass-card" style={{ padding: '8px 12px', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 16 }}>{u.avatarEmoji}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9' }}>{u.username}</div>
                <div style={{ fontSize: 10, color: '#475569' }}>Rep: {u.reputation} · Stake: {u.stakedAmount.toFixed(1)} TON</div>
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 11, color: '#64748b' }}>
              <div>{u.totalBets} ставок</div>
              <div style={{ color: u.pnl >= 0 ? '#22c55e' : '#ef4444' }}>
                {u.pnl >= 0 ? '+' : ''}{u.pnl.toFixed(2)} TON
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
