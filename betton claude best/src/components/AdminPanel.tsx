import { useStore } from '../store/useStore';

export function AdminPanel() {
  const { bets, approveBet, featureBet, cancelBet, resolveBet, financialMetrics } = useStore();

  const pending = bets.filter(b => !b.adminApproved && b.status === 'pending');
  const active = bets.filter(b => b.adminApproved && b.status === 'active');
  const resolved = bets.filter(b => b.status === 'resolved');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '16px 16px 12px', flexShrink: 0 }}>
        <h1 style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9', margin: 0 }}>
          ♟ Админ панель
        </h1>
      </div>

      <div className="scroll-area" style={{ flex: 1, padding: '0 16px 16px' }}>
        {/* Metrics */}
        <div className="glass-card" style={{ padding: 14, marginBottom: 12 }}>
          <div className="section-label" style={{ marginBottom: 10 }}>Финансы платформы</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { label: 'Общий объём', value: `${financialMetrics.totalVolume.toFixed(1)} TON` },
              { label: 'Комиссии', value: `${financialMetrics.totalFees.toFixed(2)} TON`, color: '#22c55e' },
              { label: 'Активных рынков', value: financialMetrics.activeBetsCount.toString() },
              { label: 'Завершено', value: financialMetrics.resolvedBetsCount.toString() },
              { label: 'Сред. ставка', value: `${financialMetrics.avgBetSize.toFixed(2)} TON` },
              { label: 'Объём (24ч)', value: `${financialMetrics.dailyVolume.toFixed(1)} TON` },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ fontSize: 10, color: '#475569', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: color || '#f1f5f9' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending */}
        {pending.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div className="section-label" style={{ marginBottom: 8 }}>
              Ожидают одобрения ({pending.length})
            </div>
            {pending.map(bet => (
              <div key={bet.id} className="glass-card" style={{ padding: 12, marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', marginBottom: 4, lineHeight: 1.3 }}>
                  {bet.title}
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>
                  @{bet.creatorUsername} · {bet.category}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => approveBet(bet.id)}
                          style={{ flex: 1, padding: '7px', fontSize: 12, fontWeight: 600, borderRadius: 7,
                                   background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)',
                                   color: '#22c55e', cursor: 'pointer' }}>
                    ✓ Одобрить
                  </button>
                  <button onClick={() => cancelBet(bet.id)}
                          style={{ flex: 1, padding: '7px', fontSize: 12, fontWeight: 600, borderRadius: 7,
                                   background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
                                   color: '#ef4444', cursor: 'pointer' }}>
                    ✗ Отклонить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Active */}
        <div style={{ marginBottom: 12 }}>
          <div className="section-label" style={{ marginBottom: 8 }}>
            Активные рынки ({active.length})
          </div>
          {active.map(bet => (
            <div key={bet.id} className="glass-card" style={{ padding: 12, marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9', marginBottom: 3, lineHeight: 1.3 }}>
                {bet.title}
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>
                Vol: {bet.totalVolume.toFixed(1)} TON · {bet.participants.length} участников
                · ДА {Math.round(bet.yesPrice * 100)}%
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button onClick={() => resolveBet(bet.id, 'yes')}
                        style={{ padding: '5px 10px', fontSize: 11, fontWeight: 600, borderRadius: 6,
                                 background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.25)',
                                 color: '#22c55e', cursor: 'pointer' }}>
                  Решить: ДА
                </button>
                <button onClick={() => resolveBet(bet.id, 'no')}
                        style={{ padding: '5px 10px', fontSize: 11, fontWeight: 600, borderRadius: 6,
                                 background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)',
                                 color: '#ef4444', cursor: 'pointer' }}>
                  Решить: НЕТ
                </button>
                <button onClick={() => featureBet(bet.id, !bet.featured)}
                        style={{ padding: '5px 10px', fontSize: 11, fontWeight: 600, borderRadius: 6,
                                 background: bet.featured ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)',
                                 border: `1px solid ${bet.featured ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.08)'}`,
                                 color: bet.featured ? '#f59e0b' : '#64748b', cursor: 'pointer' }}>
                  {bet.featured ? '★ Снять топ' : '☆ В топ'}
                </button>
                <button onClick={() => cancelBet(bet.id)}
                        style={{ padding: '5px 10px', fontSize: 11, borderRadius: 6,
                                 background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                                 color: '#64748b', cursor: 'pointer' }}>
                  Отменить
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Resolved */}
        {resolved.length > 0 && (
          <div>
            <div className="section-label" style={{ marginBottom: 8 }}>Завершённые ({resolved.length})</div>
            {resolved.slice(0, 5).map(bet => (
              <div key={bet.id} className="glass-card" style={{ padding: '8px 12px', marginBottom: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 12, color: '#64748b', flex: 1, minWidth: 0 }} className="line-clamp-1">
                    {bet.title}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, marginLeft: 8, flexShrink: 0,
                                  color: bet.outcome === 'yes' ? '#22c55e' : '#ef4444' }}>
                    {bet.outcome === 'yes' ? '✓ ДА' : '✗ НЕТ'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
