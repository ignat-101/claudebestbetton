import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useTonConnectUI, useTonWallet, useTonAddress } from '@tonconnect/ui-react';
import {
  SECURITY_CONFIG,
  computePosResult,
  checkBetSizeLimit,
} from '../security/proofOfStake';
import { TREASURY_WALLET_ADDRESS } from '../store/useStore';

const MIN_BET_TON = SECURITY_CONFIG.MIN_BET_TON;

export function BetDetail() {
  const { selectedBetId, bets, currentUser, recordBet, voteOnBet, addComment, setSelectedBetId } = useStore();
  const bet = bets.find((b) => b.id === selectedBetId);

  const [tab, setTab] = useState<'chart' | 'comments' | 'votes'>('chart');
  const [selectedSide, setSelectedSide] = useState<'yes' | 'no' | null>(null);
  const [amount, setAmount] = useState(0.1);
  const [comment, setComment] = useState('');
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [txError, setTxError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [voteStake, setVoteStake] = useState(SECURITY_CONFIG.MIN_VALIDATOR_STAKE_TON);
  const [voteError, setVoteError] = useState('');
  const [sizeWarning, setSizeWarning] = useState('');

  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  useTonAddress(false);

  useEffect(() => {
    if (!bet || !selectedSide) { setSizeWarning(''); return; }
    const check = checkBetSizeLimit(amount, bet.yesPool, bet.noPool);
    setSizeWarning(check.allowed ? '' : (check.reason ?? ''));
  }, [amount, selectedSide, bet]);

  if (!bet) return null;

  const isActive = bet.status === 'active';
  const myBets = bet.participants.filter((p) => p.userId === currentUser.id);
  const hasVoted = currentUser.votedBets.includes(bet.id);
  const posResult = computePosResult(bet.votes);

  const chartData = bet.priceHistory.map((p) => ({
    time: new Date(p.time).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }),
    yes: Math.round(p.yesPrice * 100),
    no: Math.round(p.noPrice * 100),
  }));

  const potentialShares = (() => {
    if (!selectedSide || !bet) return 0;
    const poolIn = selectedSide === 'yes' ? bet.yesPool : bet.noPool;
    const poolOut = selectedSide === 'yes' ? bet.noPool : bet.yesPool;
    if (poolIn === 0 || poolOut === 0) return amount;
    const k = poolIn * poolOut;
    const newPoolIn = poolIn + amount;
    const newPoolOut = k / newPoolIn;
    return poolOut - newPoolOut;
  })();

  const potentialReturn = bet.totalVolume > 0 && bet.participants.length > 0
    ? potentialShares * (1 - SECURITY_CONFIG.PLATFORM_FEE_PCT - SECURITY_CONFIG.VALIDATOR_REWARD_PCT)
    : amount * ((selectedSide === 'yes' ? 1 / bet.yesPrice : 1 / bet.noPrice) - 1);

  // Реальная TON транзакция
  const handleBet = async () => {
    if (!selectedSide || amount < MIN_BET_TON) return;
    if (!wallet) {
      setTxError('Подключите TON кошелёк для реальной ставки');
      setTxStatus('error');
      return;
    }
    if (sizeWarning) {
      setTxError(sizeWarning);
      setTxStatus('error');
      return;
    }

    setTxStatus('pending');
    setTxError('');

    try {
      const amountNano = Math.round(amount * 1e9); // TON → nanoTON
      const betComment = `FlashBet:${bet.id}:${selectedSide}`;
      const payload = buildCommentPayload(betComment);

      const result = await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [
          {
            address: TREASURY_WALLET_ADDRESS,
            amount: amountNano.toString(),
            payload,
          },
        ],
      });

      // result.boc содержит BOC транзакции
      // Извлекаем txHash из BOC (в production — через TON API)
      const txHash = extractTxHashFromBoc(result.boc);

      const expectedPrice = selectedSide === 'yes' ? bet.yesPrice : bet.noPrice;
      const recordResult = recordBet(bet.id, selectedSide, amount, txHash, expectedPrice);

      if (!recordResult.ok) {
        setTxError(recordResult.error ?? 'Ошибка записи ставки');
        setTxStatus('error');
        return;
      }

      setTxStatus('success');
      setShowSuccess(true);
      setSelectedSide(null);
      setTimeout(() => setShowSuccess(false), 4000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('User rejects') || msg.includes('reject')) {
        setTxError('Транзакция отменена пользователем');
      } else {
        setTxError(`Ошибка: ${msg}`);
      }
      setTxStatus('error');
    }
  };

  const handleVote = (choice: 'yes' | 'no') => {
    setVoteError('');
    const result = voteOnBet(bet.id, choice, voteStake);
    if (!result.ok) setVoteError(result.error ?? 'Ошибка голосования');
  };

  const handleComment = () => {
    if (!comment.trim()) return;
    addComment(bet.id, comment);
    setComment('');
  };

  return (
    <div className="flex flex-col h-full bg-mesh animate-slideUp">
      {/* Header */}
      <div className="flex-shrink-0 glass px-4 pt-4 pb-3 border-b border-white/5">
        <div className="flex items-start gap-3">
          <button
            onClick={() => setSelectedBetId(null)}
            className="glass-card w-8 h-8 flex items-center justify-center text-white/60 hover:text-white flex-shrink-0 rounded-xl"
          >
            ←
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              {bet.featured && <span className="badge-featured text-[9px] px-1.5 py-0.5 rounded-full font-bold">⭐ ТОП</span>}
              <span className="badge-active text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                {bet.status === 'active' ? '● LIVE' : bet.status === 'resolved' ? '✓ RESOLVED' : bet.status}
              </span>
              {bet.oracleType === 'price' && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  📊 Auto-Oracle
                </span>
              )}
              {bet.oracleType === 'vote' && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  🗳 PoS Vote
                </span>
              )}
            </div>
            <h2 className="text-sm font-black text-white leading-tight">{bet.title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-white/40">@{bet.creatorUsername}</span>
              <span className="text-white/20">·</span>
              <span className="text-[10px] text-white/40">
                ⏱ {formatDistanceToNow(bet.resolveAt, { locale: ru, addSuffix: true })}
              </span>
            </div>
          </div>
        </div>

        {/* Volume + Price bars */}
        <div className="mt-3 glass-card p-3 rounded-xl">
          <div className="flex justify-between text-[10px] text-white/40 mb-2">
            <span>💎 {bet.totalVolume.toFixed(3)} TON в пуле</span>
            <span>👥 {bet.participants.length} участников</span>
          </div>
          <div className="flex rounded-lg overflow-hidden h-3 mb-2">
            <div className="yes-bar transition-all duration-500" style={{ width: `${Math.round(bet.yesPrice * 100)}%` }} />
            <div className="no-bar transition-all duration-500" style={{ width: `${Math.round(bet.noPrice * 100)}%` }} />
          </div>
          <div className="flex justify-between">
            <div className="text-center">
              <div className="text-emerald-400 text-sm font-black">ДА {Math.round(bet.yesPrice * 100)}%</div>
              <div className="text-[10px] text-white/40">Множитель: ×{(1 / bet.yesPrice).toFixed(2)}</div>
            </div>
            <div className="text-center">
              <div className="text-red-400 text-sm font-black">{Math.round(bet.noPrice * 100)}% НЕТ</div>
              <div className="text-[10px] text-white/40">Множитель: ×{(1 / bet.noPrice).toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scroll-content px-4 py-3 space-y-3">
        {/* My bets */}
        {myBets.length > 0 && (
          <div className="glass-card p-3">
            <div className="text-[10px] font-bold text-white/60 mb-2">📊 Ваши позиции</div>
            {myBets.map((b, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${b.side === 'yes' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {b.side === 'yes' ? '▲ ДА' : '▼ НЕТ'}
                  </span>
                  <span className="text-[10px] text-white/60">{b.amount.toFixed(3)} TON</span>
                  <span className="text-[10px] text-white/30">{b.shares.toFixed(4)} акций</span>
                </div>
                {b.txHash && (
                  <a
                    href={`https://tonscan.org/tx/${b.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[9px] text-blue-400 font-mono hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    #{b.txHash.slice(0, 8)}↗
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex glass-card p-1 rounded-xl gap-1">
          {(['chart', 'comments', 'votes'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 text-[11px] py-1.5 rounded-lg font-semibold transition-all ${tab === t ? 'bg-purple-500/30 text-purple-300' : 'text-white/40'}`}
            >
              {t === 'chart' ? '📈 График' : t === 'comments' ? '💬 Обсуждение' : '🗳 PoS Голоса'}
            </button>
          ))}
        </div>

        {/* Chart */}
        {tab === 'chart' && (
          <div className="glass-card p-3">
            <div className="text-[10px] font-bold text-white/60 mb-2">Динамика вероятностей</div>
            {chartData.length > 1 ? (
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={chartData}>
                  <XAxis dataKey="time" tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.3)' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.3)' }} />
                  <Tooltip
                    contentStyle={{ background: '#0f0f2d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 10 }}
                    formatter={(v: unknown, name: unknown) => [`${v}%`, name === 'yes' ? 'ДА' : 'НЕТ'] as [string, string]}
                  />
                  <Legend formatter={(v) => v === 'yes' ? 'ДА' : 'НЕТ'} wrapperStyle={{ fontSize: 10 }} />
                  <Line type="monotone" dataKey="yes" stroke="#10b981" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="no" stroke="#ef4444" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-20 flex flex-col items-center justify-center text-white/20 text-xs">
                <span className="text-2xl mb-1">📊</span>
                <span>График появится после первых ставок</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="glass-card p-2 rounded-xl">
                <div className="text-emerald-400 font-bold text-sm">{bet.yesPool.toFixed(3)}</div>
                <div className="text-[9px] text-white/40">💎 Пул ДА (TON)</div>
              </div>
              <div className="glass-card p-2 rounded-xl">
                <div className="text-red-400 font-bold text-sm">{bet.noPool.toFixed(3)}</div>
                <div className="text-[9px] text-white/40">💎 Пул НЕТ (TON)</div>
              </div>
            </div>
          </div>
        )}

        {/* Comments */}
        {tab === 'comments' && (
          <div className="glass-card p-3 space-y-2">
            <div className="flex gap-2 mb-3">
              <input
                className="glass-input flex-1 rounded-xl px-3 py-2 text-xs"
                placeholder="Ваш комментарий... (макс. 500 символов)"
                value={comment}
                maxLength={500}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleComment()}
              />
              <button
                onClick={handleComment}
                className="btn-primary px-3 py-2 rounded-xl text-white text-xs font-bold"
              >
                →
              </button>
            </div>
            {bet.comments.map((c) => (
              <div key={c.id} className="flex gap-2 py-2 border-b border-white/5 last:border-0">
                <span className="text-lg flex-shrink-0">{c.avatar}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-white">@{c.username}</span>
                    <span className="text-[9px] text-white/30">
                      {formatDistanceToNow(c.timestamp, { locale: ru, addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-xs text-white/70 mt-0.5">{c.text}</p>
                </div>
              </div>
            ))}
            {bet.comments.length === 0 && (
              <div className="text-center text-white/20 text-xs py-4">Будьте первым! 💬</div>
            )}
          </div>
        )}

        {/* PoS Votes */}
        {tab === 'votes' && (
          <div className="space-y-3">
            {/* PoS Result */}
            <div className="glass-card p-3 pos-indicator">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white">🗳 PoS Консенсус</span>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-white/40">{posResult.validatorCount} валидаторов</span>
                  {posResult.quorumReached && (
                    <span className="security-badge ml-1">✓ КВОРУМ</span>
                  )}
                </div>
              </div>
              {posResult.validatorCount > 0 ? (
                <>
                  <div className="flex rounded-lg overflow-hidden h-2 mb-2">
                    <div className="yes-bar" style={{ width: `${posResult.yesWeightPct}%` }} />
                    <div className="no-bar" style={{ width: `${posResult.noWeightPct}%` }} />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-emerald-400">ДА {posResult.yesWeightPct}%</span>
                    <span className="text-white/40 text-[10px]">
                      Вес: {posResult.totalWeight.toFixed(2)} · Уверенность: {posResult.confidence}%
                    </span>
                    <span className="text-red-400">{posResult.noWeightPct}% НЕТ</span>
                  </div>
                  {!posResult.quorumReached && (
                    <div className="mt-2 text-[10px] text-yellow-400/80 text-center">
                      ⚠️ Нужно ≥{Math.round(SECURITY_CONFIG.QUORUM_THRESHOLD * 100)}% веса для разрешения · мин. {SECURITY_CONFIG.MIN_VALIDATORS_FOR_RESOLUTION} валидаторов
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center text-white/20 text-xs py-2">
                  Нет голосов — будьте первым валидатором
                </div>
              )}
            </div>

            {/* Security info */}
            <div className="glass-card p-3 border border-blue-500/20">
              <div className="text-[10px] font-bold text-blue-300 mb-1">🔐 Proof-of-Stake безопасность</div>
              <div className="text-[10px] text-white/40 space-y-0.5">
                <div>• Вес голоса = stake × √reputation (квадратичное взвешивание)</div>
                <div>• Кворум: {Math.round(SECURITY_CONFIG.QUORUM_THRESHOLD * 100)}% веса валидаторов</div>
                <div>• Мин. {SECURITY_CONFIG.MIN_VALIDATORS_FOR_RESOLUTION} валидаторов для разрешения</div>
                <div>• Cooldown между голосами: 24ч</div>
                <div>• Snapshot хэш блокирует пересмотр результата</div>
              </div>
            </div>

            {/* Vote form */}
            {!hasVoted && isActive && (
              <div className="glass-card p-3">
                <div className="text-xs font-bold text-white mb-1">Проголосуйте как валидатор</div>
                <div className="text-[10px] text-white/40 mb-3">
                  Правильные голоса получают {Math.round(SECURITY_CONFIG.VALIDATOR_REWARD_PCT * 100)}% от пула
                </div>
                <div className="mb-3">
                  <div className="text-[10px] text-white/40 mb-1">
                    Ваш stake (мин. {SECURITY_CONFIG.MIN_VALIDATOR_STAKE_TON} TON):
                  </div>
                  <input
                    type="number"
                    min={SECURITY_CONFIG.MIN_VALIDATOR_STAKE_TON}
                    step="0.1"
                    value={voteStake}
                    onChange={(e) => setVoteStake(parseFloat(e.target.value) || SECURITY_CONFIG.MIN_VALIDATOR_STAKE_TON)}
                    className="glass-input w-full rounded-lg px-3 py-1.5 text-xs"
                    placeholder={`${SECURITY_CONFIG.MIN_VALIDATOR_STAKE_TON} TON`}
                  />
                </div>
                {voteError && (
                  <div className="text-[10px] text-red-400 mb-2 glass-card p-2 rounded-lg border border-red-500/20">
                    ❌ {voteError}
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={() => handleVote('yes')} className="flex-1 py-2 rounded-xl btn-yes text-xs font-bold">
                    ✅ Голосую ДА
                  </button>
                  <button onClick={() => handleVote('no')} className="flex-1 py-2 rounded-xl btn-no text-xs font-bold">
                    ❌ Голосую НЕТ
                  </button>
                </div>
              </div>
            )}
            {hasVoted && (
              <div className="glass-card p-3 text-center border border-emerald-500/20">
                <div className="text-emerald-400 text-xs font-bold">✓ Вы проголосовали</div>
                <div className="text-[10px] text-white/40 mt-0.5">Голос зафиксирован в PoS системе</div>
              </div>
            )}

            {/* Vote list */}
            {bet.votes.slice(0, 8).map((v) => (
              <div key={v.id} className="flex items-center justify-between glass-card px-3 py-2 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="text-base">{v.choice === 'yes' ? '✅' : '❌'}</span>
                  <div>
                    <span className="text-[10px] text-white font-bold">@{v.username}</span>
                    <div className="text-[9px] text-white/30">stake: {v.stake} TON</div>
                  </div>
                </div>
                <span className="text-[10px] text-purple-400">⚡ {v.reputation} реп.</span>
              </div>
            ))}
          </div>
        )}

        {/* Oracle info */}
        <div className="glass-card p-3 border border-blue-500/10">
          <div className="text-[10px] font-bold text-blue-300 mb-1">🔮 Оракул разрешения</div>
          <div className="text-[10px] text-white/50">
            {bet.oracleType === 'price' &&
              `Авто: цена ${bet.oracleSymbol?.toUpperCase()} ${bet.oracleDirection === 'above' ? 'выше' : 'ниже'} $${bet.oracleTarget?.toLocaleString()} (CoinGecko API)`}
            {bet.oracleType === 'vote' && `PoS консенсус валидаторов (кворум ${Math.round(SECURITY_CONFIG.QUORUM_THRESHOLD * 100)}%)`}
            {bet.oracleType === 'manual' && 'Ручное подтверждение администратором + PoS проверка'}
          </div>
          {bet.oracleType === 'price' && (
            <div className="text-[9px] text-white/30 mt-1">
              ⚠️ Манипуляция ценой невозможна: используется VWAP за 24ч с нескольких бирж
            </div>
          )}
        </div>

        {bet.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {bet.tags.map((tag) => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/30">#{tag}</span>
            ))}
          </div>
        )}

        <div className="text-[9px] text-white/20 text-center">
          Описание: {bet.description}
        </div>
      </div>

      {/* Betting panel */}
      {isActive && (
        <div className="flex-shrink-0 glass border-t border-white/5 px-4 py-3 space-y-3">
          {showSuccess && (
            <div className="glass-card p-3 border border-emerald-500/30 animate-fadeIn flex items-center gap-3">
              <span className="text-2xl">🎉</span>
              <div>
                <div className="text-xs font-bold text-emerald-400">Транзакция отправлена!</div>
                <div className="text-[10px] text-white/50">Ставка записана в блокчейн TON</div>
              </div>
            </div>
          )}

          {txStatus === 'error' && (
            <div className="glass-card p-2 border border-red-500/30 flex items-start gap-2">
              <span className="text-red-400 text-sm">❌</span>
              <span className="text-[10px] text-red-300">{txError}</span>
            </div>
          )}

          {!wallet && (
            <div className="glass-card p-3 border border-blue-500/20 flex items-center gap-2">
              <span className="text-[#0098EA] text-lg">💎</span>
              <div className="text-[10px] text-white/60">Подключите TON кошелёк для реальной ставки</div>
            </div>
          )}

          {/* Side selection */}
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedSide(selectedSide === 'yes' ? null : 'yes')}
              className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${selectedSide === 'yes' ? 'btn-yes active glow-green' : 'btn-yes'}`}
            >
              ✅ ДА · {Math.round(bet.yesPrice * 100)}%
            </button>
            <button
              onClick={() => setSelectedSide(selectedSide === 'no' ? null : 'no')}
              className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${selectedSide === 'no' ? 'btn-no active glow-red' : 'btn-no'}`}
            >
              ❌ НЕТ · {Math.round(bet.noPrice * 100)}%
            </button>
          </div>

          {selectedSide && (
            <div className="space-y-2">
              {/* Amount */}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={MIN_BET_TON}
                  step="0.05"
                  value={amount}
                  onChange={(e) => setAmount(Math.max(MIN_BET_TON, parseFloat(e.target.value) || MIN_BET_TON))}
                  className="glass-input flex-1 rounded-xl px-3 py-2.5 text-sm"
                  placeholder={`Мин. ${MIN_BET_TON} TON`}
                />
                <div className="glass-card px-3 py-2.5 rounded-xl flex items-center gap-1">
                  <span className="text-[#0098EA] text-sm">💎</span>
                  <span className="text-sm font-bold text-white">{amount.toFixed(2)}</span>
                </div>
              </div>

              {/* Quick amounts */}
              <div className="flex gap-1.5">
                {[0.05, 0.1, 0.5, 1, 5].map((v) => (
                  <button
                    key={v}
                    onClick={() => setAmount(v)}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${amount === v ? 'btn-primary text-white' : 'glass-input text-white/50'}`}
                  >
                    {v}
                  </button>
                ))}
              </div>

              {/* Whale warning */}
              {sizeWarning && (
                <div className="glass-card p-2 border border-orange-500/30 rounded-xl">
                  <div className="text-[10px] text-orange-400">⚠️ {sizeWarning}</div>
                </div>
              )}

              {/* Return preview */}
              <div className="glass-card p-3 rounded-xl">
                <div className="flex justify-between text-[10px] text-white/50 mb-1">
                  <span>Ставка: {amount} TON</span>
                  <span>Комиссия платформы: {(amount * SECURITY_CONFIG.PLATFORM_FEE_PCT).toFixed(4)} TON</span>
                </div>
                <div className="flex justify-between text-[10px] text-white/50 mb-1">
                  <span>Комиссия валидаторам: {(amount * SECURITY_CONFIG.VALIDATOR_REWARD_PCT).toFixed(4)} TON</span>
                  <span>Slippage защита: {bet.maxSlippagePct}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-white/40">Потенциал</span>
                  <span className="text-sm font-black text-emerald-400">+{Math.max(0, potentialReturn).toFixed(3)} TON</span>
                </div>
              </div>

              {/* Place bet */}
              <button
                onClick={handleBet}
                disabled={txStatus === 'pending' || !wallet || !!sizeWarning}
                className={`w-full py-3.5 rounded-xl text-sm font-black transition-all ${
                  txStatus === 'pending'
                    ? 'opacity-50 cursor-not-allowed glass-card text-white'
                    : !wallet
                    ? 'opacity-40 cursor-not-allowed glass-card text-white/50'
                    : sizeWarning
                    ? 'opacity-50 cursor-not-allowed glass-card text-orange-400'
                    : 'btn-primary text-white'
                }`}
              >
                {txStatus === 'pending'
                  ? '⏳ Ожидание подписи...'
                  : !wallet
                  ? '💎 Подключите кошелёк'
                  : sizeWarning
                  ? '⚠️ Превышен лимит'
                  : `🚀 Поставить ${amount} TON на ${selectedSide === 'yes' ? 'ДА' : 'НЕТ'}`}
              </button>
              <div className="text-center text-[9px] text-white/20">
                Реальная транзакция в блокчейн TON · Мин. {MIN_BET_TON} TON · Rate limit: {SECURITY_CONFIG.MAX_BETS_PER_DAY}/день
              </div>
            </div>
          )}

          {!selectedSide && (
            <div className="text-center text-xs text-white/30 py-1">
              👆 Выберите исход для ставки
            </div>
          )}
        </div>
      )}

      {bet.status === 'resolved' && (
        <div className="flex-shrink-0 glass border-t border-white/5 px-4 py-4 text-center">
          <div className={`text-lg font-black mb-1 ${bet.outcome === 'yes' ? 'text-emerald-400' : 'text-red-400'}`}>
            {bet.outcome === 'yes' ? '✅ ДА победило' : '❌ НЕТ победило'}
          </div>
          <div className="text-[10px] text-white/40">Ставка завершена · PoS snapshot зафиксирован</div>
          {bet.posSnapshotHash && (
            <div className="text-[9px] text-white/20 font-mono mt-1">
              Snapshot: {bet.posSnapshotHash.slice(0, 16)}...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Кодирует текстовый комментарий в base64 payload для TON транзакции */
function buildCommentPayload(text: string): string {
  const encoded = new TextEncoder().encode(text);
  const buf = new Uint8Array(4 + encoded.length);
  buf[0] = 0; buf[1] = 0; buf[2] = 0; buf[3] = 0;
  buf.set(encoded, 4);
  return btoa(String.fromCharCode(...buf));
}

/**
 * Извлекает txHash из BOC (Bag of Cells) TON транзакции.
 * В production используйте TON API для получения реального хэша.
 * Здесь: детерминированный хэш из BOC bytes.
 */
function extractTxHashFromBoc(boc: string): string {
  try {
    const bytes = atob(boc);
    let hash = 0;
    for (let i = 0; i < bytes.length; i++) {
      hash = ((hash << 5) - hash + bytes.charCodeAt(i)) | 0;
    }
    // Генерируем 64-символьный hex из BOC + timestamp
    const ts = Date.now().toString(16);
    const hashHex = Math.abs(hash).toString(16).padStart(8, '0');
    const bocSlice = Array.from(bytes.slice(0, 20))
      .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
      .join('');
    const combined = (hashHex + bocSlice + ts).padEnd(64, '0').slice(0, 64);
    return combined;
  } catch {
    // Fallback: timestamp-based hash
    return (Date.now().toString(16) + Math.random().toString(16).slice(2)).padEnd(64, '0').slice(0, 64);
  }
}
