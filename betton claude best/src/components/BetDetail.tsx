import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { computePosResult } from '../security/proofOfStake';

const MIN_BET = 0.05;
const PLATFORM_FEE = 0.05;

export function BetDetail() {
  const { selectedBetId, bets, currentUser, placeBet, addComment, setSelectedBetId, tonWalletAddress } = useStore();
  const bet = bets.find(b => b.id === selectedBetId);

  const [side, setSide] = useState<'yes' | 'no' | null>(null);
  const [amount, setAmount] = useState(0.5);
  const [comment, setComment] = useState('');
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [txError, setTxError] = useState('');
  const [activeTab, setActiveTab] = useState<'chart' | 'orderbook' | 'comments' | 'bets'>('chart');

  useEffect(() => { setSide(null); setTxStatus('idle'); setTxError(''); }, [selectedBetId]);

  if (!bet) return null;

  const yesPct = Math.round(bet.yesPrice * 100);
  const noPct = 100 - yesPct;
  const isActive = bet.status === 'active';
  const isConnected = !!tonWalletAddress;
  const myBets = bet.participants.filter(p => p.userId === currentUser?.id);

  const potentialReturn = side && amount >= MIN_BET
    ? amount * (1 / Math.max(0.01, side === 'yes' ? bet.yesPrice : bet.noPrice)) * (1 - PLATFORM_FEE)
    : 0;
  const potentialProfit = potentialReturn - amount;

  const chartData = bet.priceHistory.map(p => ({
    t: new Date(p.time).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }),
    yes: Math.round(p.yesPrice * 100),
    no: Math.round(p.noPrice * 100),
  }));

  // PoS result
  const posResult = bet.posVotes.length > 0
    ? computePosResult(bet.posVotes.map(v => ({
        userId: v.userId, username: v.username, choice: v.choice,
        stake: v.stake, reputation: v.reputation, timestamp: v.timestamp,
        txHash: v.txHash, stakeAge: v.stakeAge, confidence: v.confidence,
      })))
    : null;

  const handleBet = async () => {
    if (!side || amount < MIN_BET) return;
    if (!isConnected) { setTxError('Подключите TON кошелёк'); setTxStatus('error'); return; }
    setTxStatus('pending'); setTxError('');
    await new Promise(r => setTimeout(r, 1200));
    const txHash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const result = placeBet(bet.id, side, amount, txHash);
    if (!result.ok) { setTxError(result.error || 'Ошибка'); setTxStatus('error'); return; }
    setTxStatus('success'); setSide(null);
    setTimeout(() => setTxStatus('idle'), 3000);
  };

  const handleComment = () => {
    if (!comment.trim() || !currentUser) return;
    addComment(bet.id, comment);
    setComment('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }} className="page-enter">
      {/* Header */}
      <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
        <button
          onClick={() => setSelectedBetId(null)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 13, marginBottom: 10, cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
        >
          ← Назад
        </button>

        <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
          {bet.featured && <span className="badge-featured">⭐ Топ</span>}
          {bet.status === 'active'   && <span className="badge-live"><span className="live-dot" />LIVE</span>}
          {bet.status === 'voting'   && <span className="badge-voting">🗳 VOTE</span>}
          {bet.status === 'resolved' && <span className="badge-resolved">✓ Resolved</span>}
          {bet.oracleType === 'price' && (
            <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' }}>
              📊 Oracle
            </span>
          )}
        </div>

        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', margin: '0 0 6px', lineHeight: 1.4 }}>{bet.title}</h2>
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
            <span style={{ color: '#22c55e' }}>ДА {yesPct}¢</span>
            <span style={{ color: '#94a3b8', fontSize: 11 }}>
              {bet.totalVolume > 0 ? `${bet.totalVolume.toFixed(2)} TON · ${bet.participants.length} уч.` : 'Нет ставок'}
            </span>
            <span style={{ color: '#ef4444' }}>НЕТ {noPct}¢</span>
          </div>
        </div>
      </div>

      {/* Scrollable */}
      <div className="scroll-area" style={{ flex: 1, padding: '12px 16px 16px' }}>
        {/* Bet panel */}
        {isActive && (
          <div className="glass-card" style={{ padding: 14, marginBottom: 12 }}>
            {/* Side buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              <button
                className={`btn-yes ${side === 'yes' ? 'active' : ''}`}
                onClick={() => setSide(side === 'yes' ? null : 'yes')}
                style={{ padding: '10px 0', fontSize: 13 }}
              >
                ДА · {yesPct}¢
              </button>
              <button
                className={`btn-no ${side === 'no' ? 'active' : ''}`}
                onClick={() => setSide(side === 'no' ? null : 'no')}
                style={{ padding: '10px 0', fontSize: 13 }}
              >
                НЕТ · {noPct}¢
              </button>
            </div>

            {side && (
              <>
                {/* Amount input */}
                <div style={{ marginBottom: 10 }}>
                  <div className="section-label" style={{ marginBottom: 4 }}>Сумма ставки (TON)</div>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                    <input
                      type="number"
                      className="form-input"
                      value={amount}
                      min={MIN_BET}
                      step={0.1}
                      onChange={e => setAmount(Math.max(MIN_BET, parseFloat(e.target.value) || MIN_BET))}
                    />
                  </div>
                  <input type="range" className="stake-slider" min={MIN_BET} max={10} step={0.05}
                    value={amount} onChange={e => setAmount(parseFloat(e.target.value))} />
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    {[0.1, 0.5, 1, 2, 5].map(v => (
                      <button key={v} className="btn-ghost"
                        onClick={() => setAmount(v)}
                        style={{ fontSize: 11, padding: '3px 8px', flex: 1 }}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Returns */}
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 12px', marginBottom: 10, fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ color: '#64748b' }}>Потенциальная выплата</span>
                    <span style={{ color: '#f1f5f9', fontWeight: 700 }}>{potentialReturn.toFixed(2)} TON</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ color: '#64748b' }}>Прибыль</span>
                    <span style={{ color: potentialProfit > 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                      {potentialProfit > 0 ? '+' : ''}{potentialProfit.toFixed(2)} TON
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Комиссия платформы</span>
                    <span style={{ color: '#64748b' }}>5%</span>
                  </div>
                </div>

                {/* Status */}
                {txStatus === 'success' && (
                  <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, padding: '8px 12px', marginBottom: 10, color: '#22c55e', fontSize: 13, textAlign: 'center' }}>
                    ✅ Ставка принята! Цена обновлена.
                  </div>
                )}
                {txStatus === 'error' && (
                  <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '8px 12px', marginBottom: 10, color: '#ef4444', fontSize: 13 }}>
                    ❌ {txError}
                  </div>
                )}

                {!isConnected && (
                  <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '8px 12px', marginBottom: 10, color: '#fbbf24', fontSize: 12 }}>
                    ⚠️ Подключите TON кошелёк для ставки
                  </div>
                )}

                <button
                  className="btn-primary"
                  onClick={handleBet}
                  disabled={txStatus === 'pending' || !isConnected || amount < MIN_BET}
                  style={{ width: '100%', padding: 12, fontSize: 14 }}
                >
                  {txStatus === 'pending' ? '⏳ Транзакция...' : `Поставить ${amount} TON на ${side === 'yes' ? 'ДА' : 'НЕТ'}`}
                </button>
              </>
            )}

            {!side && (
              <div style={{ fontSize: 12, color: '#475569', textAlign: 'center' }}>
                Выберите исход и введите сумму ставки
              </div>
            )}
          </div>
        )}

        {/* My positions */}
        {myBets.length > 0 && (
          <div className="glass-card" style={{ padding: 12, marginBottom: 12 }}>
            <div className="section-label" style={{ marginBottom: 8 }}>Мои позиции</div>
            {myBets.map((p, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < myBets.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', fontSize: 12 }}>
                <span style={{ color: p.side === 'yes' ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                  {p.side === 'yes' ? 'ДА' : 'НЕТ'} · {p.amount.toFixed(2)} TON
                </span>
                <span style={{ color: '#64748b' }}>по {Math.round((p.filledPrice ?? p.expectedPrice) * 100)}¢</span>
                {p.pnl !== undefined && (
                  <span style={{ color: p.pnl >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                    {p.pnl >= 0 ? '+' : ''}{p.pnl.toFixed(2)} TON
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Resolved outcome */}
        {bet.status === 'resolved' && bet.resolvedOutcome && (
          <div style={{
            marginBottom: 12, padding: '10px 14px', borderRadius: 10,
            background: bet.resolvedOutcome === 'yes' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${bet.resolvedOutcome === 'yes' ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: bet.resolvedOutcome === 'yes' ? '#22c55e' : '#ef4444', marginBottom: 2 }}>
              {bet.resolvedOutcome === 'yes' ? '✓ ДА победило' : '✗ НЕТ победило'}
            </div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Результат определён PoS консенсусом</div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: 4 }}>
          {(['chart', 'orderbook', 'bets', 'comments'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{
                flex: 1, padding: '6px 4px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                background: activeTab === tab ? '#181c27' : 'transparent',
                color: activeTab === tab ? '#f1f5f9' : '#64748b',
              }}
            >
              {tab === 'chart' ? '📈 График' : tab === 'orderbook' ? '📒 Книга' : tab === 'bets' ? '📊 Ставки' : '💬 Чат'}
            </button>
          ))}
        </div>

        {/* Chart */}
        {activeTab === 'chart' && (
          <div>
            {chartData.length > 1 ? (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData}>
                  <XAxis dataKey="t" tick={{ fontSize: 9, fill: '#475569' }} interval="preserveStartEnd" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#475569' }} width={28} />
                  <Tooltip
                    contentStyle={{ background: '#181c27', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 11 }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Line type="monotone" dataKey="yes" stroke="#22c55e" strokeWidth={2} dot={false} name="ДА%" />
                  <Line type="monotone" dataKey="no"  stroke="#ef4444" strokeWidth={2} dot={false} name="НЕТ%" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#475569', fontSize: 13 }}>
                Данных пока нет — сделайте первую ставку!
              </div>
            )}

            {bet.description && (
              <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>
                {bet.description}
              </div>
            )}

            {/* Oracle info */}
            {bet.oracleType === 'price' && bet.oracleSymbol && (
              <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 8, fontSize: 12 }}>
                <span style={{ color: '#60a5fa' }}>📊 Оракул: </span>
                <span style={{ color: '#94a3b8' }}>{bet.oracleSymbol} {bet.oracleDirection === 'above' ? '>' : '<'} ${bet.oracleTarget?.toLocaleString()}</span>
              </div>
            )}

            {/* PoS status */}
            {posResult && (
              <div className="pos-card" style={{ marginTop: 10, padding: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#c084fc', marginBottom: 6 }}>🗳 Proof-of-Stake статус</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8' }}>
                  <span>Валидаторов: {posResult.validatorCount}</span>
                  <span>Уверенность: {posResult.confidence}%</span>
                  {posResult.collisionRisk && <span style={{ color: '#f59e0b' }}>⚠️ Коллюзия</span>}
                </div>
                <div style={{ display: 'flex', height: 6, borderRadius: 4, overflow: 'hidden', gap: 1, marginTop: 8 }}>
                  <div style={{ width: `${posResult.yesWeightPct}%`, background: 'rgba(34,197,94,0.7)', borderRadius: '3px 0 0 3px' }} />
                  <div style={{ width: `${posResult.noWeightPct}%`, background: 'rgba(239,68,68,0.7)', borderRadius: '0 3px 3px 0' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748b', marginTop: 4 }}>
                  <span>ДА {posResult.yesWeightPct}%</span>
                  <span>{posResult.quorumReached ? '✓ Кворум' : '⏳ Нет кворума'}</span>
                  <span>НЕТ {posResult.noWeightPct}%</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Orderbook */}
        {activeTab === 'orderbook' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <div className="section-label" style={{ marginBottom: 6, color: '#22c55e' }}>Продают ДА</div>
                {bet.yesOrders.map((o, i) => (
                  <div key={i} className="orderbook-row">
                    <div className="orderbook-row-bg" style={{ width: `${Math.min(100, o.size * 10)}%`, background: '#22c55e' }} />
                    <span style={{ color: '#22c55e', flex: 1 }}>{Math.round(o.price * 100)}¢</span>
                    <span style={{ color: '#94a3b8' }}>{o.size.toFixed(1)}</span>
                  </div>
                ))}
              </div>
              <div>
                <div className="section-label" style={{ marginBottom: 6, color: '#ef4444' }}>Продают НЕТ</div>
                {bet.noOrders.map((o, i) => (
                  <div key={i} className="orderbook-row">
                    <div className="orderbook-row-bg" style={{ width: `${Math.min(100, o.size * 10)}%`, background: '#ef4444' }} />
                    <span style={{ color: '#ef4444', flex: 1 }}>{Math.round(o.price * 100)}¢</span>
                    <span style={{ color: '#94a3b8' }}>{o.size.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 10, fontSize: 11, color: '#475569', textAlign: 'center' }}>
              Цены обновляются автоматически по AMM при каждой ставке
            </div>
          </div>
        )}

        {/* Bets list */}
        {activeTab === 'bets' && (
          <div>
            {bet.participants.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: '#475569', fontSize: 13 }}>
                Ставок пока нет. Будьте первым!
              </div>
            ) : (
              bet.participants.slice().reverse().map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 12 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ color: p.side === 'yes' ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                      {p.side === 'yes' ? 'ДА' : 'НЕТ'}
                    </span>
                    <span style={{ color: '#94a3b8' }}>@{p.username}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{p.amount.toFixed(2)} TON</div>
                    <div style={{ fontSize: 10, color: '#475569' }}>по {Math.round((p.filledPrice ?? p.expectedPrice) * 100)}¢</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Comments */}
        {activeTab === 'comments' && (
          <div>
            {isConnected && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input
                  className="form-input"
                  placeholder="Ваш комментарий..."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleComment()}
                />
                <button className="btn-primary" onClick={handleComment} style={{ padding: '0 14px', whiteSpace: 'nowrap' }}>
                  ➤
                </button>
              </div>
            )}
            {bet.comments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: '#475569', fontSize: 13 }}>
                Пока нет комментариев. Будьте первым!
              </div>
            ) : (
              bet.comments.slice().reverse().map(c => (
                <div key={c.id} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 3, fontSize: 11 }}>
                    <span style={{ color: '#60a5fa', fontWeight: 600 }}>@{c.username}</span>
                    <span style={{ color: '#475569' }}>{formatDistanceToNow(c.time, { locale: ru, addSuffix: true })}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#d1d5db', lineHeight: 1.4 }}>{c.text}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
