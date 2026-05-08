import { useStore } from '../store/useStore';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

export function Portfolio() {
  const { bets, currentUser, setSelectedBetId, setActiveTab, tonWalletAddress } = useStore();

  if (!tonWalletAddress || !currentUser) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>💎</div>
        <h2 style={{ color: '#f1f5f9', marginBottom: 8 }}>Нет подключения</h2>
        <p style={{ color: '#64748b', fontSize: 13, textAlign: 'center', marginBottom: 20 }}>
          Подключите TON кошелёк чтобы видеть свои ставки
        </p>
      </div>
    );
  }

  // Collect all my bets
  type MyPosition = {
    betId: string; betTitle: string; side: 'yes' | 'no';
    amount: number; filledPrice?: number; pnl?: number; time: number;
    betStatus: string; resolvedOutcome?: string;
  };

  const myPositions: MyPosition[] = bets.flatMap(b =>
    b.participants
      .filter(p => p.userId === currentUser.id)
      .map(p => ({
        betId: b.id, betTitle: b.title, side: p.side,
        amount: p.amount, filledPrice: p.filledPrice, pnl: p.pnl,
        time: p.time, betStatus: b.status, resolvedOutcome: b.resolvedOutcome,
      }))
  ).sort((a, b) => b.time - a.time);

  const myPosVotes = bets.flatMap(b =>
    b.posVotes.filter(v => v.userId === currentUser.id).map(v => ({
      betId: b.id, betTitle: b.title,
      choice: v.choice, stake: v.stake, timestamp: v.timestamp,
      betStatus: b.status, resolvedOutcome: b.resolvedOutcome,
    }))
  ).sort((a, b) => b.timestamp - a.timestamp);

  const totalInvested = myPositions.reduce((s, p) => s + p.amount, 0);
  const totalPnl = myPositions.reduce((s, p) => s + (p.pnl ?? 0), 0);
  const activePositions = myPositions.filter(p => p.betStatus === 'active' || p.betStatus === 'voting');
  const resolvedPositions = myPositions.filter(p => p.betStatus === 'resolved');
  const wins = resolvedPositions.filter(p => (p.pnl ?? 0) > 0).length;
  const losses = resolvedPositions.filter(p => (p.pnl ?? 0) < 0).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '16px 16px 12px', flexShrink: 0 }}>
        <h1 style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9', margin: '0 0 12px' }}>Портфолио</h1>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 4 }}>
          <div className="glass-card" style={{ padding: '12px 14px' }}>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Всего вложено</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9' }}>{totalInvested.toFixed(2)}</div>
            <div style={{ fontSize: 10, color: '#64748b' }}>TON</div>
          </div>
          <div className="glass-card" style={{ padding: '12px 14px' }}>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Прибыль / Убыток</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: totalPnl >= 0 ? '#22c55e' : '#ef4444' }}>
              {totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(2)}
            </div>
            <div style={{ fontSize: 10, color: '#64748b' }}>TON</div>
          </div>
          <div className="glass-card" style={{ padding: '12px 14px' }}>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Активных ставок</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#3b82f6' }}>{activePositions.length}</div>
          </div>
          <div className="glass-card" style={{ padding: '12px 14px' }}>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Побед / Поражений</div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>
              <span style={{ color: '#22c55e' }}>{wins}</span>
              <span style={{ color: '#64748b', fontSize: 14 }}> / </span>
              <span style={{ color: '#ef4444' }}>{losses}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="scroll-area" style={{ flex: 1, padding: '0 16px 16px' }}>
        {/* Active positions */}
        {activePositions.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div className="section-label" style={{ marginBottom: 8 }}>Активные позиции</div>
            {activePositions.map((p, i) => (
              <div key={i} className="market-card" style={{ padding: 12, marginBottom: 8 }}
                onClick={() => { setSelectedBetId(p.betId); setActiveTab('bets'); }}>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4, lineHeight: 1.3 }}>{p.betTitle}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ color: p.side === 'yes' ? '#22c55e' : '#ef4444', fontWeight: 700, fontSize: 13 }}>
                      {p.side === 'yes' ? 'ДА' : 'НЕТ'}
                    </span>
                    <span style={{ color: '#64748b', fontSize: 11, marginLeft: 6 }}>по {Math.round((p.filledPrice ?? 0.5) * 100)}¢</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>{p.amount.toFixed(2)} TON</div>
                    <div style={{ fontSize: 10, color: '#475569' }}>
                      {formatDistanceToNow(p.time, { locale: ru, addSuffix: true })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Resolved positions */}
        {resolvedPositions.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div className="section-label" style={{ marginBottom: 8 }}>Завершённые</div>
            {resolvedPositions.map((p, i) => (
              <div key={i} className="glass-card" style={{ padding: 12, marginBottom: 8, opacity: 0.85 }}>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4, lineHeight: 1.3 }}>{p.betTitle}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ color: p.side === 'yes' ? '#22c55e' : '#ef4444', fontWeight: 700, fontSize: 12 }}>
                      {p.side === 'yes' ? 'ДА' : 'НЕТ'}
                    </span>
                    {p.resolvedOutcome && (
                      <span style={{ marginLeft: 6, fontSize: 11, color: p.side === p.resolvedOutcome ? '#22c55e' : '#ef4444' }}>
                        {p.side === p.resolvedOutcome ? '✓ Выиграл' : '✗ Проиграл'}
                      </span>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {p.pnl !== undefined && (
                      <div style={{ fontSize: 13, fontWeight: 700, color: p.pnl >= 0 ? '#22c55e' : '#ef4444' }}>
                        {p.pnl >= 0 ? '+' : ''}{p.pnl.toFixed(2)} TON
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: '#64748b' }}>{p.amount.toFixed(2)} TON</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PoS votes */}
        {myPosVotes.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div className="section-label" style={{ marginBottom: 8 }}>🗳 Мои PoS голоса</div>
            {myPosVotes.map((v, i) => (
              <div key={i} className="glass-card" style={{ padding: 12, marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4, lineHeight: 1.3 }}>{v.betTitle}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: v.choice === 'yes' ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                    {v.choice === 'yes' ? '✓ ДА' : '✗ НЕТ'}
                  </span>
                  <span style={{ color: '#a855f7' }}>{v.stake.toFixed(1)} TON стейк</span>
                  <span style={{ color: '#475569' }}>{v.betStatus === 'resolved' ? '✓ Завершено' : '⏳ Активно'}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {myPositions.length === 0 && myPosVotes.length === 0 && (
          <div style={{ textAlign: 'center', padding: '50px 20px', color: '#475569' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
            <p style={{ marginBottom: 16 }}>У вас пока нет ставок</p>
            <button className="btn-primary" style={{ padding: '8px 20px' }}
              onClick={() => setActiveTab('bets')}>
              Посмотреть рынки
            </button>
          </div>
        )}

        {/* Referral */}
        <div className="glass-card" style={{ padding: 14, marginBottom: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9', marginBottom: 4 }}>🎁 Реферальная программа</div>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>
            Получайте 1% от ставок приглашённых + 0.5% от их рефералов
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{
              flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: '6px 10px',
              fontSize: 13, fontWeight: 700, color: '#60a5fa', border: '1px solid rgba(255,255,255,0.06)',
              letterSpacing: '0.05em',
            }}>
              {currentUser.referralCode}
            </div>
            <button
              className="btn-ghost"
              style={{ padding: '6px 12px', fontSize: 12 }}
              onClick={() => { navigator.clipboard.writeText(`https://betton.app?ref=${currentUser.referralCode}`); }}
            >
              📋 Копировать
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
