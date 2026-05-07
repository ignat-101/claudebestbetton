import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { SECURITY_CONFIG, computePosResult, checkBetSizeLimit } from '../security/proofOfStake';

const MIN_BET = SECURITY_CONFIG.MIN_BET_TON;

// Minimal TON Connect-like stub for demo (real integration via @tonconnect/ui-react)
function useTonWalletStub() {
  const { tonWalletAddress } = useStore();
  return { connected: !!tonWalletAddress, address: tonWalletAddress };
}

function buildDemoTxHash(): string {
  return Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

export function BetDetail() {
  const {
    selectedBetId, bets, currentUser, recordBet, voteOnBet, addComment,
    setSelectedBetId,
  } = useStore();
  const bet = bets.find(b => b.id === selectedBetId);
  const wallet = useTonWalletStub();

  const [tab, setTab] = useState<'chart' | 'comments' | 'votes'>('chart');
  const [side, setSide] = useState<'yes' | 'no' | null>(null);
  const [amount, setAmount] = useState(0.1);
  const [comment, setComment] = useState('');
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [txError, setTxError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [voteStake, setVoteStake] = useState(SECURITY_CONFIG.MIN_VALIDATOR_STAKE_TON);
  const [voteError, setVoteError] = useState('');
  const [sizeWarn, setSizeWarn] = useState('');

  useEffect(() => {
    if (!bet || !side) { setSizeWarn(''); return; }
    const check = checkBetSizeLimit(amount, bet.yesPool, bet.noPool);
    setSizeWarn(check.allowed ? '' : (check.reason ?? ''));
  }, [amount, side, bet]);

  if (!bet) return null;

  const isActive = bet.status === 'active';
  const myBets = bet.participants.filter(p => p.userId === currentUser.id);
  const hasVoted = currentUser.votedBets.includes(bet.id);
  const posResult = computePosResult(bet.votes);
  const yesWidth = Math.round(bet.yesPrice * 100);

  const chartData = bet.priceHistory.map(p => ({
    t: new Date(p.time).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }),
    yes: Math.round(p.yesPrice * 100),
    no: Math.round(p.noPrice * 100),
  }));

  const potentialReturn = side
    ? amount * (side === 'yes' ? (1 / Math.max(0.01, bet.yesPrice)) - 1 : (1 / Math.max(0.01, bet.noPrice)) - 1) *
      (1 - SECURITY_CONFIG.PLATFORM_FEE_PCT - SECURITY_CONFIG.VALIDATOR_REWARD_PCT)
    : 0;

  const handleBet = async () => {
    if (!side || amount < MIN_BET) return;
    if (!wallet.connected) {
      setTxError('Подключите TON кошелёк');
      setTxStatus('error');
      return;
    }
    if (sizeWarn) { setTxError(sizeWarn); setTxStatus('error'); return; }

    setTxStatus('pending');
    setTxError('');

    // In production: use @tonconnect/ui-react sendTransaction
    // Here we simulate confirmed tx for demo purposes
    await new Promise(r => setTimeout(r, 1200));
    const txHash = buildDemoTxHash();
    const expectedPrice = side === 'yes' ? bet.yesPrice : bet.noPrice;
    const result = recordBet(bet.id, side, amount, txHash, expectedPrice);

    if (!result.ok) {
      setTxError(result.error ?? 'Ошибка');
      setTxStatus('error');
      return;
    }
    setTxStatus('success');
    setShowSuccess(true);
    setSide(null);
    setTimeout(() => { setShowSuccess(false); setTxStatus('idle'); }, 3500);
  };

  const handleVote = (choice: 'yes' | 'no') => {
    setVoteError('');
    const r = voteOnBet(bet.id, choice, voteStake);
    if (!r.ok) setVoteError(r.error ?? 'Ошибка голосования');
  };

  return (
    <div className="flex flex-col h-full bg-mesh animate-slideUp">
      {/* Header */}
      <div className="flex-shrink-0 glass px-4 pt-4 pb-3 border-b border-white/5">
        <div className="flex items-start gap-3">
          <button
            onClick={() => setSelectedBetId(null)}
            className="glass-card w-8 h-8 flex items-center justify-center text-white/50 hover:text-white flex-shrink-0 rounded-xl text-lg"
          >←</button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              {bet.featured && <span className="badge-featured text-[9px] px-1.5 py-0.5 rounded-full font-bold">⭐ ТОП</span>}
              {bet.status === 'active' && <span className="badge-active text-[9px] px-1.5 py-0.5 rounded-full font-bold">● LIVE</span>}
              {bet.oracleType === 'price' && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/25">📊 Oracle</span>}
              {bet.oracleType === 'vote' && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/25">⚖️ PoS Vote</span>}
            </div>
            <h2 className="text-sm font-black text-white leading-tight">{bet.title}</h2>
            <div className="flex items-center gap-2 mt-1 text-[10px] text-white/35">
              <span>@{bet.creatorUsername}</span>
              <span>·</span>
              <span>⏱ {formatDistanceToNow(bet.resolveAt, { locale: ru, addSuffix: true })}</span>
            </div>
          </div>
        </div>

        {/* Pools */}
        <div className="mt-3 glass-card p-3 rounded-xl">
          <div className="flex justify-between text-[10px] text-white/35 mb-2">
            <span>💎 {bet.totalVolume.toFixed(3)} TON в пуле</span>
            <span>👥 {bet.participants.length} участников</span>
          </div>
          <div className="flex rounded-md overflow-hidden h-2 mb-2">
            <div className="yes-bar transition-all duration-500" style={{ width: `${yesWidth}%` }} />
            <div className="no-bar transition-all duration-500" style={{ width: `${100-yesWidth}%` }} />
          </div>
          <div className="flex justify-between text-[12px] font-black">
            <span className="text-emerald-400">ДА {yesWidth}%</span>
            <span className="text-red-400">НЕТ {100-yesWidth}%</span>
          </div>
        </div>

        {/* My bets */}
        {myBets.length > 0 && (
          <div className="mt-2 flex gap-2 flex-wrap">
            {myBets.map((mb, i) => (
              <div key={i} className={`text-[10px] px-2 py-1 rounded-full border font-semibold ${mb.side === 'yes' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-red-500/15 text-red-400 border-red-500/30'}`}>
                Моя ставка: {mb.side === 'yes' ? 'ДА' : 'НЕТ'} {mb.amount} TON
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bet panel */}
      {isActive && (
        <div className="flex-shrink-0 px-4 py-3 border-b border-white/5">
          {showSuccess ? (
            <div className="glass-card p-4 rounded-xl text-center animate-fadeIn glow-green">
              <div className="text-2xl mb-1">🎉</div>
              <p className="text-emerald-400 font-bold text-sm">Ставка принята!</p>
              <p className="text-white/50 text-[11px] mt-1">Транзакция подтверждена on-chain</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <button className={`btn-yes flex-1 text-sm font-bold py-2.5 rounded-xl ${side === 'yes' ? 'active' : ''}`} onClick={() => setSide(side === 'yes' ? null : 'yes')}>
                  ✅ ДА
                </button>
                <button className={`btn-no flex-1 text-sm font-bold py-2.5 rounded-xl ${side === 'no' ? 'active' : ''}`} onClick={() => setSide(side === 'no' ? null : 'no')}>
                  ❌ НЕТ
                </button>
              </div>

              {side && (
                <div className="glass-card p-3 rounded-xl space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-white/50">Сумма ставки</span>
                    <span className="text-[11px] text-emerald-400 font-semibold">
                      Потенциал: +{potentialReturn.toFixed(3)} TON
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    {[0.1, 0.5, 1, 5].map(v => (
                      <button key={v} onClick={() => setAmount(v)}
                        className={`flex-1 text-[11px] py-1 rounded-lg font-semibold transition-all ${amount === v ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50' : 'glass text-white/50 hover:text-white'}`}>
                        {v}
                      </button>
                    ))}
                    <input
                      type="number" step="0.01" min={MIN_BET}
                      value={amount}
                      onChange={e => setAmount(Math.max(MIN_BET, parseFloat(e.target.value) || MIN_BET))}
                      className="glass-input flex-1 text-[11px] text-center rounded-lg px-1 py-1 w-14"
                    />
                  </div>
                  {sizeWarn && <p className="text-[10px] text-amber-400">⚠️ {sizeWarn}</p>}
                  {txError && <p className="text-[10px] text-red-400">❌ {txError}</p>}
                  {!wallet.connected && <p className="text-[10px] text-amber-400">⚠️ Подключите TON кошелёк для реальных ставок</p>}
                  <button
                    onClick={handleBet}
                    disabled={txStatus === 'pending'}
                    className="btn-primary w-full text-white text-sm font-bold py-2.5 rounded-xl disabled:opacity-50"
                  >
                    {txStatus === 'pending' ? '⏳ Отправка...' : `Поставить ${amount} TON на ${side === 'yes' ? 'ДА' : 'НЕТ'}`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex-shrink-0 flex border-b border-white/5">
        {(['chart', 'votes', 'comments'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-[11px] font-semibold transition-colors ${tab === t ? 'text-purple-400 border-b-2 border-purple-400' : 'text-white/35'}`}>
            {t === 'chart' ? '📈 График' : t === 'votes' ? `⚖️ PoS (${bet.votes.length})` : `💬 (${bet.comments.length})`}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto scroll-content px-4 py-3">
        {tab === 'chart' && (
          <div className="space-y-3">
            <p className="text-[11px] text-white/40 leading-relaxed">{bet.description}</p>
            {chartData.length > 1 ? (
              <div className="glass-card p-3 rounded-xl">
                <p className="text-[10px] text-white/30 mb-2 font-semibold">История цены (%)</p>
                <ResponsiveContainer width="100%" height={120}>
                  <LineChart data={chartData}>
                    <XAxis dataKey="t" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }} />
                    <YAxis domain={[0,100]} tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }} />
                    <Tooltip contentStyle={{ background: 'rgba(10,10,35,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }} />
                    <Line type="monotone" dataKey="yes" stroke="#10b981" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="no" stroke="#ef4444" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="glass-card p-4 rounded-xl text-center text-white/30 text-sm">
                📊 График появится после первых ставок
              </div>
            )}

            {/* Info */}
            <div className="glass-card p-3 rounded-xl space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-white/40">Тип оракула</span>
                <span className="text-white/70">{bet.oracleType === 'price' ? '📊 Price Feed' : bet.oracleType === 'vote' ? '⚖️ PoS Vote' : '👤 Manual'}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-white/40">Комиссия платформы</span>
                <span className="text-white/70">{bet.feePercent}%</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-white/40">Награда валидаторам</span>
                <span className="text-white/70">{SECURITY_CONFIG.VALIDATOR_REWARD_PCT * 100}%</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-white/40">Теги</span>
                <span className="text-white/70">{bet.tags.join(', ')}</span>
              </div>
            </div>
          </div>
        )}

        {tab === 'votes' && (
          <div className="space-y-3">
            {/* PoS Status */}
            <div className="glass-card p-4 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] font-bold text-white">⚖️ PoS Результат</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${posResult.quorumReached ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/40'}`}>
                  {posResult.quorumReached ? `✅ Кворум ${posResult.confidence}%` : `⏳ ${posResult.validatorCount}/${SECURITY_CONFIG.MIN_VALIDATORS_FOR_RESOLUTION} вал.`}
                </span>
              </div>
              <div className="flex rounded-md overflow-hidden h-2 mb-2">
                <div className="pos-bar-yes transition-all" style={{ width: `${posResult.yesWeightPct}%` }} />
                <div className="pos-bar-no transition-all" style={{ width: `${posResult.noWeightPct}%` }} />
              </div>
              <div className="flex justify-between text-[11px] font-semibold">
                <span className="text-emerald-400">ДА {posResult.yesWeightPct}%</span>
                <span className="text-red-400">НЕТ {posResult.noWeightPct}%</span>
              </div>
              {posResult.collusionRisk && (
                <p className="text-[10px] text-amber-400 mt-2">⚠️ Обнаружен риск сговора — голоса поданы в течение 5 минут</p>
              )}
              {posResult.supermajority && (
                <p className="text-[10px] text-purple-400 mt-2">🔐 Суперквалифицированное большинство ≥80%</p>
              )}
            </div>

            {/* Vote */}
            {!hasVoted && isActive && (
              <div className="glass-card p-3 rounded-xl space-y-2">
                <p className="text-[11px] text-white/50">Ваш голос (квадратичное взвешивание по stake)</p>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-white/40">Stake</span>
                  <input type="number" step="0.01" min={SECURITY_CONFIG.MIN_VALIDATOR_STAKE_TON}
                    value={voteStake} onChange={e => setVoteStake(Math.max(SECURITY_CONFIG.MIN_VALIDATOR_STAKE_TON, parseFloat(e.target.value) || SECURITY_CONFIG.MIN_VALIDATOR_STAKE_TON))}
                    className="glass-input text-[12px] px-2 py-1 rounded-lg w-24 text-center" />
                  <span className="text-[11px] text-white/40">TON</span>
                </div>
                {voteError && <p className="text-[10px] text-red-400">{voteError}</p>}
                <div className="flex gap-2">
                  <button onClick={() => handleVote('yes')} className="btn-yes flex-1 py-2 rounded-xl text-sm font-bold">✅ ДА</button>
                  <button onClick={() => handleVote('no')} className="btn-no flex-1 py-2 rounded-xl text-sm font-bold">❌ НЕТ</button>
                </div>
              </div>
            )}
            {hasVoted && <div className="text-center text-[11px] text-emerald-400 py-2">✅ Ваш голос засчитан</div>}

            {/* Votes list */}
            {bet.votes.length === 0 ? (
              <div className="text-center py-6 text-white/30 text-sm">Голосов пока нет</div>
            ) : (
              <div className="space-y-2">
                {bet.votes.map(v => (
                  <div key={v.id} className="glass-card px-3 py-2 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[12px] font-semibold text-white">@{v.username}</span>
                      <div className="text-[10px] text-white/35">Stake: {v.stake} TON · Rep: {v.reputation}</div>
                    </div>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${v.choice === 'yes' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {v.choice === 'yes' ? '✅ ДА' : '❌ НЕТ'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'comments' && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                className="glass-input flex-1 rounded-xl px-3 py-2 text-[12px]"
                placeholder="Ваш комментарий..."
                value={comment}
                onChange={e => setComment(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { addComment(bet.id, comment); setComment(''); } }}
              />
              <button onClick={() => { addComment(bet.id, comment); setComment(''); }}
                className="btn-primary text-white text-[12px] font-bold px-3 py-2 rounded-xl">
                →
              </button>
            </div>
            {bet.comments.length === 0 ? (
              <div className="text-center py-6 text-white/30 text-sm">Комментариев пока нет</div>
            ) : (
              <div className="space-y-2">
                {[...bet.comments].reverse().map(c => (
                  <div key={c.id} className="glass-card px-3 py-2.5 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{c.avatar}</span>
                      <span className="text-[11px] font-semibold text-white">@{c.username}</span>
                      <span className="text-[10px] text-white/30">{formatDistanceToNow(c.timestamp, { locale: ru, addSuffix: true })}</span>
                    </div>
                    <p className="text-[12px] text-white/70">{c.text}</p>
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
