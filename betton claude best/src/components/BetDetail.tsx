import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const MIN_BET = 0.1;
const PLATFORM_FEE = 0.02;

export function BetDetail() {
  const { selectedBetId, bets, currentUser, recordBet, addComment, setSelectedBetId, tonWalletAddress } = useStore();
  const bet = bets.find(b => b.id === selectedBetId);

  const [side, setSide] = useState<'yes' | 'no' | null>(null);
  const [amount, setAmount] = useState(0.5);
  const [comment, setComment] = useState('');
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [txError, setTxError] = useState('');
  const [activeTab, setActiveTab] = useState<'chart' | 'comments' | 'bets'>('chart');

  useEffect(() => { setSide(null); setTxStatus('idle'); setTxError(''); }, [selectedBetId]);

  if (!bet) return null;

  const yesPct = Math.round(bet.yesPrice * 100);
  const noPct = 100 - yesPct;
  const isActive = bet.status === 'active';
  const isConnected = !!tonWalletAddress;
  const myBets = bet.participants.filter(p => p.userId === currentUser.id);

  // Potential return calculation (like polymarket)
  const potentialReturn = side && amount >= MIN_BET
    ? amount * (1 / (side === 'yes' ? Math.max(0.01, bet.yesPrice) : Math.max(0.01, bet.noPrice))) * (1 - PLATFORM_FEE)
    : 0;
  const potentialProfit = potentialReturn - amount;

  const chartData = bet.priceHistory.map(p => ({
    t: new Date(p.time).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }),
    yes: Math.round(p.yesPrice * 100),
    no: Math.round(p.noPrice * 100),
  }));

  const handleBet = async () => {
    if (!side || amount < MIN_BET) return;
    if (!isConnected) {
      setTxError('Подключите TON кошелёк');
      setTxStatus('error');
      return;
    }
    setTxStatus('pending');
    setTxError('');

    // Simulate TX delay (real: use @tonconnect/ui-react sendTransaction)
    await new Promise(r => setTimeout(r, 1200));
    const txHash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const expectedPrice = side === 'yes' ? bet.yesPrice : bet.noPrice;
    const result = recordBet(bet.id, side, amount, txHash, expectedPrice);

    if (!result.ok) {
      setTxError(result.error || 'Ошибка');
      setTxStatus('error');
      return;
    }
    setTxStatus('success');
    setSide(null);
    setTimeout(() => setTxStatus('idle'), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }} className="page-enter">
      {/* Header */}
      <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
        <button
          onClick={() => setSelectedBetId(null)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b',
                   fontSize: 13, marginBottom: 10, cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
        >
          ← Назад
        </button>

        <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
          {bet.featured && <span className="badge-featured">🔥 Топ</span>}
          {bet.status === 'active' && <span className="badge-live"><span className="live-dot" />LIVE</span>}
          {bet.status === 'voting' && <span className="badge-voting">🗳 VOTE</span>}
          {bet.status === 'resolved' && <span className="badge-resolved">✓ Resolved</span>}
          {bet.oracleType === 'price' && (
            <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(59,130,246,0.1)',
                           color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' }}>📊 Oracle</span>
          )}
        </div>

        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', margin: '0 0 6px', lineHeight: 1.4 }}>
          {bet.title}
        </h2>
        <div style={{ fontSize: 11, color: '#475569', display: 'flex', gap: 8 }}>
          <span>@{bet.creatorUsername}</span>
          <span>·</span>
          <span>⏱ {formatDistanceToNow(bet.resolveAt, { locale: ru, addSuffix: true })}</span>
        </div>

        {/* Prob bar */}
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', height: 8, borderRadius: 6, overflow: 'hidden', gap: 1, marginBottom: 6 }}>
            <div className="prob-bar-yes" style={{ width: `${yesPct}%` }} />
            <div className="prob-bar-no" style={{ width: `${noPct}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 800 }}>
            <span style={{ color: '#22c55e' }}>ДА {yesPct}%</span>
            <span style={{ color: '#94a3b8', fontSize: 11 }}>
              {bet.totalVolume.toFixed(1)} TON · {bet.participants.length} участников
            </span>
            <span style={{ color: '#ef4444' }}>НЕТ {noPct}%</span>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="scroll-area" style={{ flex: 1, padding: '12px 16px 16px' }}>
        {/* Bet panel */}
        {isActive && (
          <div className="glass-card" style={{ padding: 14, marginBottom: 12 }}>
            {/* Side buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              <button
                className={`btn-yes ${side === 'yes' ? 'active' : ''}`}
                style={{ padding: '10px', fontSize: 14 }}
                onClick={() => setSide(side === 'yes' ? null : 'yes')}
              >
                ДА · {yesPct}%
              </button>
              <button
                className={`btn-no ${side === 'no' ? 'active' : ''}`}
                style={{ padding: '10px', fontSize: 14 }}
                onClick={() => setSide(side === 'no' ? null : 'no')}
              >
                НЕТ · {noPct}%
              </button>
            </div>

            {side && (
              <>
                {/* Amount input */}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>Сумма ставки (TON)</div>
                  <input
                    type="number" min={0.1} step={0.1}
                    value={amount}
                    onChange={e => setAmount(Number(e.target.value))}
                    className="form-input"
                  />
                  {/* Quick amounts */}
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    {[0.5, 1, 5, 10, 50].map(v => (
                      <button key={v}
                        onClick={() => setAmount(v)}
                        style={{ flex: 1, padding: '4px 0', fontSize: 11, borderRadius: 6,
                                 background: amount === v ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)',
                                 border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', cursor: 'pointer' }}>
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Return calculation */}
                {amount >= MIN_BET && (
                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 10px',
                                marginBottom: 10, fontSize: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ color: '#64748b' }}>Потенциальный выигрыш</span>
                      <span style={{ color: '#f1f5f9', fontWeight: 700 }}>{potentialReturn.toFixed(2)} TON</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ color: '#64748b' }}>Прибыль</span>
                      <span style={{ color: potentialProfit >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                        {potentialProfit >= 0 ? '+' : ''}{potentialProfit.toFixed(2)} TON
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#475569', fontSize: 10 }}>Комиссия платформы (2%)</span>
                      <span style={{ color: '#475569', fontSize: 10 }}>{(amount * PLATFORM_FEE).toFixed(3)} TON</span>
                    </div>
                  </div>
                )}

                {/* Place bet button */}
                <button
                  className="btn-primary"
                  style={{ width: '100%', padding: '11px', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  disabled={txStatus === 'pending' || amount < MIN_BET}
                  onClick={handleBet}
                >
                  {txStatus === 'pending' ? (
                    <><div className="spinner" /> Подтверждение...</>
                  ) : txStatus === 'success' ? (
                    '✓ Ставка принята!'
                  ) : (
                    isConnected
                      ? `Поставить ${amount} TON на ${side === 'yes' ? 'ДА' : 'НЕТ'}`
                      : '🔗 Подключите кошелёк'
                  )}
                </button>

                {txError && (
                  <div style={{ marginTop: 8, padding: '7px 10px', borderRadius: 6, fontSize: 12,
                                background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                    ⚠️ {txError}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* My positions */}
        {myBets.length > 0 && (
          <div className="glass-card" style={{ padding: 12, marginBottom: 12 }}>
            <div className="section-label" style={{ marginBottom: 8 }}>Мои позиции</div>
            {myBets.map((mb, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '6px 0', borderBottom: i < myBets.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                                    fontSize: 12 }}>
                <span style={{ color: mb.side === 'yes' ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                  {mb.side === 'yes' ? 'ДА' : 'НЕТ'}
                </span>
                <span style={{ color: '#94a3b8' }}>{mb.amount.toFixed(2)} TON</span>
                <span style={{ color: '#64748b' }}>@ {Math.round(mb.avgPrice * 100)}%</span>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, marginBottom: 12, background: 'rgba(255,255,255,0.04)',
                      borderRadius: 8, padding: 3 }}>
          {(['chart', 'comments', 'bets'] as const).map(tab => (
            <button key={tab}
              onClick={() => setActiveTab(tab)}
              style={{ flex: 1, padding: '6px 8px', fontSize: 12, fontWeight: 600, borderRadius: 6,
                       background: activeTab === tab ? 'rgba(255,255,255,0.1)' : 'transparent',
                       color: activeTab === tab ? '#f1f5f9' : '#64748b', border: 'none', cursor: 'pointer', transition: 'all 0.15s' }}>
              {tab === 'chart' ? '📈 График' : tab === 'comments' ? `💬 ${bet.comments.length}` : `👥 Ставки`}
            </button>
          ))}
        </div>

        {/* Chart */}
        {activeTab === 'chart' && (
          <div className="glass-card" style={{ padding: 12 }}>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>История вероятности (%)</div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <XAxis dataKey="t" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Tooltip
                  contentStyle={{ background: '#1e2333', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 11 }}
                  formatter={(v: unknown, name: unknown) => [`${v}%`, name === 'yes' ? 'ДА' : 'НЕТ'] as [string, string]}
                />
                <Line type="monotone" dataKey="yes" stroke="#22c55e" strokeWidth={2} dot={false} name="yes" />
                <Line type="monotone" dataKey="no" stroke="#ef4444" strokeWidth={1.5} dot={false} name="no" strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>

            {/* Description */}
            {bet.description && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)',
                            fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>
                {bet.description}
              </div>
            )}

            {/* Tags */}
            {bet.tags.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                {bet.tags.map(tag => (
                  <span key={tag} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10,
                                           background: 'rgba(255,255,255,0.06)', color: '#64748b' }}>
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Comments */}
        {activeTab === 'comments' && (
          <div>
            {/* Add comment */}
            <div className="glass-card" style={{ padding: 12, marginBottom: 10 }}>
              <textarea
                className="form-input"
                placeholder="Написать комментарий..."
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={2}
                style={{ marginBottom: 8 }}
              />
              <button
                className="btn-primary"
                style={{ padding: '7px 16px', fontSize: 12 }}
                disabled={!comment.trim()}
                onClick={() => { addComment(bet.id, comment); setComment(''); }}
              >
                Отправить
              </button>
            </div>

            {bet.comments.length === 0 && (
              <div style={{ textAlign: 'center', color: '#475569', padding: '30px 0', fontSize: 13 }}>
                Комментариев пока нет
              </div>
            )}

            {bet.comments.map(c => (
              <div key={c.id} className="glass-card" style={{ padding: '10px 12px', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 18 }}>{c.avatar}</span>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>@{c.username}</span>
                    <span style={{ fontSize: 10, color: '#475569', marginLeft: 6 }}>
                      {formatDistanceToNow(c.timestamp, { locale: ru, addSuffix: true })}
                    </span>
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: '#cbd5e1', lineHeight: 1.5 }}>{c.text}</p>
              </div>
            ))}
          </div>
        )}

        {/* All bets */}
        {activeTab === 'bets' && (
          <div>
            {bet.participants.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#475569', padding: '30px 0', fontSize: 13 }}>
                Ставок пока нет
              </div>
            ) : (
              <div className="glass-card" style={{ overflow: 'hidden' }}>
                {/* Header */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 70px 60px', gap: 8,
                              padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)',
                              fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <span>Участник</span>
                  <span style={{ textAlign: 'right' }}>Сумма</span>
                  <span style={{ textAlign: 'center' }}>Позиция</span>
                  <span style={{ textAlign: 'right' }}>Цена</span>
                </div>
                {bet.participants.slice().reverse().map((p, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 70px 60px', gap: 8,
                                        padding: '8px 12px', borderBottom: i < bet.participants.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                                        fontSize: 12 }}>
                    <span style={{ color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      @{p.username}
                    </span>
                    <span style={{ color: '#f1f5f9', fontWeight: 600, textAlign: 'right' }}>
                      {p.amount.toFixed(2)} TON
                    </span>
                    <span style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 700,
                                     background: p.side === 'yes' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                                     color: p.side === 'yes' ? '#22c55e' : '#ef4444' }}>
                        {p.side === 'yes' ? 'ДА' : 'НЕТ'}
                      </span>
                    </span>
                    <span style={{ color: '#64748b', textAlign: 'right' }}>
                      {Math.round(p.avgPrice * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
