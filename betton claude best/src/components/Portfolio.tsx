import { useStore } from '../store/useStore';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

const PLATFORM_FEE = 0.02;

export function Portfolio() {
  const { bets, currentUser, setSelectedBetId, setActiveTab, tonWalletAddress } = useStore();

  const myBets = bets.filter(b =>
    b.participants.some(p => p.userId === currentUser.id)
  );

  const activeBets = myBets.filter(b => b.status === 'active');
  const resolvedBets = myBets.filter(b => b.status === 'resolved' || b.status === 'cancelled');

  // Calculate stats from real bets
  const totalWagered = currentUser.totalWagered;
  const totalWon = currentUser.totalWon;
  const pnl = totalWon - totalWagered;
  const roi = totalWagered > 0 ? ((pnl / totalWagered) * 100).toFixed(1) : '0.0';
  const roiPos = parseFloat(roi) >= 0;

  // Active positions with current unrealized value
  const activePositions = activeBets.map(bet => {
    const myParticipations = bet.participants.filter(p => p.userId === currentUser.id);
    const invested = myParticipations.reduce((s, p) => s + p.amount, 0);
    const side = myParticipations[0]?.side;
    const currentProb = side === 'yes' ? bet.yesPrice : bet.noPrice;
    const shares = myParticipations.reduce((s, p) => s + p.shares, 0);
    const currentValue = shares * currentProb * (1 - PLATFORM_FEE);
    return { bet, invested, currentValue, side, shares };
  });

  const unrealizedPnl = activePositions.reduce((s, p) => s + (p.currentValue - p.invested), 0);

  if (!tonWalletAddress && myBets.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>💼</div>
        <h2 style={{ color: '#f1f5f9', marginBottom: 8, fontSize: 18, textAlign: 'center' }}>Ваш портфель пуст</h2>
        <p style={{ color: '#64748b', textAlign: 'center', fontSize: 13, marginBottom: 24 }}>
          Подключите кошелёк и сделайте первую ставку
        </p>
        <button
          className="btn-primary"
          style={{ padding: '10px 24px', fontSize: 14 }}
          onClick={() => setActiveTab('bets')}
        >
          Перейти к рынкам
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '16px 16px 12px', flexShrink: 0 }}>
        <h1 style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9', margin: 0 }}>Портфель</h1>
      </div>

      <div className="scroll-area" style={{ flex: 1, padding: '0 16px 16px' }}>
        {/* Stats */}
        <div className="glass-card" style={{ padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, textAlign: 'center' }}>
            <div>
              <div className="stat-value">{totalWagered.toFixed(1)}</div>
              <div className="stat-label">TON вложено</div>
            </div>
            <div>
              <div className="stat-value" style={{ color: roiPos ? '#22c55e' : '#ef4444' }}>
                {roiPos ? '+' : ''}{roi}%
              </div>
              <div className="stat-label">ROI</div>
            </div>
            <div>
              <div className="stat-value">{myBets.length}</div>
              <div className="stat-label">Ставок</div>
            </div>
          </div>

          {unrealizedPnl !== 0 && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)',
                          display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: '#64748b' }}>Нереализованный P&L</span>
              <span style={{ color: unrealizedPnl >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                {unrealizedPnl >= 0 ? '+' : ''}{unrealizedPnl.toFixed(2)} TON
              </span>
            </div>
          )}
        </div>

        {/* Active positions */}
        {activePositions.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div className="section-label" style={{ marginBottom: 8 }}>Активные позиции</div>
            {activePositions.map(({ bet, invested, currentValue, side }) => {
              const yesPct = Math.round(bet.yesPrice * 100);
              const pnlItem = currentValue - invested;
              return (
                <div key={bet.id} className="market-card" style={{ padding: '12px 14px', marginBottom: 8 }}
                     onClick={() => { setSelectedBetId(bet.id); setActiveTab('bets'); }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', marginBottom: 8, lineHeight: 1.3 }}
                       className="line-clamp-2">
                    {bet.title}
                  </div>

                  <div style={{ display: 'flex', height: 4, borderRadius: 3, overflow: 'hidden', gap: 1, marginBottom: 6 }}>
                    <div className="prob-bar-yes" style={{ width: `${yesPct}%` }} />
                    <div className="prob-bar-no" style={{ width: `${100 - yesPct}%` }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 4, fontSize: 11 }}>
                    <div>
                      <div style={{ color: '#475569' }}>Позиция</div>
                      <div style={{ color: side === 'yes' ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                        {side === 'yes' ? 'ДА' : 'НЕТ'}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#475569' }}>Вложено</div>
                      <div style={{ color: '#f1f5f9', fontWeight: 600 }}>{invested.toFixed(2)}</div>
                    </div>
                    <div>
                      <div style={{ color: '#475569' }}>Тек. стоим.</div>
                      <div style={{ color: '#f1f5f9', fontWeight: 600 }}>{currentValue.toFixed(2)}</div>
                    </div>
                    <div>
                      <div style={{ color: '#475569' }}>P&L</div>
                      <div style={{ color: pnlItem >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                        {pnlItem >= 0 ? '+' : ''}{pnlItem.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 6, fontSize: 10, color: '#475569' }}>
                    ⏱ {formatDistanceToNow(bet.resolveAt, { locale: ru, addSuffix: true })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Resolved */}
        {resolvedBets.length > 0 && (
          <div>
            <div className="section-label" style={{ marginBottom: 8 }}>История</div>
            {resolvedBets.map(bet => {
              const myP = bet.participants.filter(p => p.userId === currentUser.id);
              const invested = myP.reduce((s, p) => s + p.amount, 0);
              const side = myP[0]?.side;
              const won = bet.status === 'resolved' && bet.outcome === side;

              return (
                <div key={bet.id} className="glass-card" style={{ padding: '10px 14px', marginBottom: 8,
                                                                    display: 'flex', justifyContent: 'space-between',
                                                                    alignItems: 'center' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.3 }} className="line-clamp-1">
                      {bet.title}
                    </div>
                    <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>
                      {side === 'yes' ? 'ДА' : 'НЕТ'} · {invested.toFixed(2)} TON
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {bet.status === 'resolved' ? (
                      <span style={{ fontSize: 12, fontWeight: 700, color: won ? '#22c55e' : '#ef4444' }}>
                        {won ? '✓ Победа' : '✗ Проигрыш'}
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, color: '#64748b' }}>Отменено</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {myBets.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#475569' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
            <p>Ставок пока нет</p>
            <button className="btn-primary" style={{ marginTop: 12, padding: '8px 20px', fontSize: 13 }}
                    onClick={() => setActiveTab('bets')}>
              Найти рынок
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
