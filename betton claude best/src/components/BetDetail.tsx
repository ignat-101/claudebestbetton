import { useState, useCallback } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { useStore, TREASURY_WALLET_ADDRESS } from '../store/useStore';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

const MIN_BET_TON = 0.05; // minimum bet in TON
const MAX_BET_TON = 100;

function toNano(ton: number): string {
  return Math.floor(ton * 1_000_000_000).toString();
}

export function BetDetail() {
  const { selectedBetId, setSelectedBetId, bets, currentUser, recordBet, voteOnBet, addComment, tonWalletAddress } = useStore();
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();

  const bet = bets.find((b) => b.id === selectedBetId);

  const [tab, setTab] = useState<'chart' | 'comments' | 'votes'>('chart');
  const [selectedSide, setSelectedSide] = useState<'yes' | 'no' | null>(null);
  const [amount, setAmount] = useState<number>(0.1);
  const [comment, setComment] = useState('');
  const [isTxPending, setIsTxPending] = useState(false);
  const [txStatus, setTxStatus] = useState<'idle' | 'signing' | 'sent' | 'error'>('idle');
  const [txError, setTxError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  if (!bet) return null;

  const isActive = bet.status === 'active' && bet.adminApproved;
  const myBets = bet.participants.filter((p) => p.userId === currentUser.id);
  const hasVoted = currentUser.votedBets.includes(bet.id);
  const yesPct = Math.round(bet.yesPrice * 100);
  const noPct = 100 - yesPct;

  const chartData = bet.priceHistory.map((p) => ({
    time: new Date(p.time).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }),
    yes: Math.round(p.yesPrice * 100),
    no: Math.round(p.noPrice * 100),
    volume: p.volume,
  }));

  const totalVotes = bet.votes.length;
  const yesVotes = bet.votes.filter((v) => v.choice === 'yes').length;
  const yesVotePct = totalVotes > 0 ? Math.round((yesVotes / totalVotes) * 100) : 50;

  // Calculate potential return
  const potentialReturn = selectedSide
    ? (() => {
        const poolIn = selectedSide === 'yes' ? bet.yesPool : bet.noPool;
        const poolOut = selectedSide === 'yes' ? bet.noPool : bet.yesPool;
        const k = poolIn * poolOut;
        const newPoolIn = poolIn + amount;
        const newPoolOut = k / newPoolIn;
        const shares = poolOut - newPoolOut;
        const totalPool = bet.yesPool + bet.noPool + amount;
        const fee = totalPool * 0.05;
        const prize = totalPool - fee;
        return (shares * prize) / (selectedSide === 'yes' ? bet.yesPool + amount : bet.noPool + amount) || 0;
      })()
    : 0;

  const handlePlaceBet = useCallback(async () => {
    if (!selectedSide || amount < MIN_BET_TON) return;

    if (!wallet || !tonWalletAddress) {
      // Open connect modal
      tonConnectUI.openModal();
      return;
    }

    setIsTxPending(true);
    setTxStatus('signing');
    setTxError('');

    try {
      // Encode bet info as comment payload
      // We use a simple text comment: "BET:{betId}:{side}"
      // In a real production app you'd use a smart contract, here we send to treasury
      const commentText = `BET:${bet.id}:${selectedSide}`;
      const payload = buildCommentPayload(commentText);

      const tx = {
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [
          {
            address: TREASURY_WALLET_ADDRESS,
            amount: toNano(amount),
            payload,
          },
        ],
      };

      const result = await tonConnectUI.sendTransaction(tx);

      // Transaction was signed and sent
      const txHash = result.boc ? btoa(result.boc).slice(0, 24) : `tx_${Date.now()}`;
      setTxStatus('sent');

      // Record bet client-side
      recordBet(bet.id, selectedSide, amount, txHash);

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 4000);
      setSelectedSide(null);
      setAmount(0.1);
      setTxStatus('idle');
    } catch (err: any) {
      if (err?.message?.includes('Reject') || err?.message?.includes('User rejected')) {
        setTxError('Транзакция отменена пользователем');
      } else {
        setTxError(err?.message || 'Ошибка транзакции');
      }
      setTxStatus('error');
    } finally {
      setIsTxPending(false);
    }
  }, [selectedSide, amount, wallet, tonWalletAddress, bet, tonConnectUI, recordBet]);

  const handleComment = () => {
    if (!comment.trim()) return;
    addComment(bet.id, comment.trim());
    setComment('');
  };

  return (
    <div className="flex flex-col h-full bg-mesh animate-slideUp">
      {/* Header */}
      <div className="flex-shrink-0 glass-card rounded-none rounded-b-2xl px-4 pt-3 pb-4 mx-0" style={{ borderRadius: 0, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          onClick={() => setSelectedBetId(null)}
          className="flex items-center gap-2 text-white/50 text-sm mb-3 hover:text-white transition-colors"
        >
          ← Назад
        </button>
        <div className="flex items-start gap-2 mb-2">
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0 mt-0.5 ${
            bet.status === 'active' ? 'badge-active' : bet.status === 'resolved' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' : 'badge-pending'
          }`}>
            {bet.status === 'active' ? '● LIVE' : bet.status === 'resolved' ? '✓ ИТОГ' : '⏳ ОЖИДАНИЕ'}
          </span>
          <h2 className="text-base font-black text-white leading-tight flex-1">{bet.title}</h2>
        </div>
        <p className="text-xs text-white/40 mb-3">{bet.description}</p>

        {/* Stats row */}
        <div className="flex gap-3 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-[#0098EA]">💎</span>
            <span className="text-white font-bold">{bet.totalVolume.toFixed(2)} TON</span>
            <span className="text-white/40">объём</span>
          </div>
          <div className="text-white/40">·</div>
          <div className="text-white/40">
            👥 {bet.participants.length} участников
          </div>
          <div className="text-white/40">·</div>
          <div className="text-white/40">
            ⏱ {formatDistanceToNow(bet.resolveAt, { locale: ru, addSuffix: true })}
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto scroll-content px-4 py-3 space-y-3" style={{ paddingBottom: isActive ? '200px' : '20px' }}>
        {/* Probability */}
        <div className="glass-card p-3">
          <div className="flex justify-between mb-2">
            <span className="text-emerald-400 font-bold text-sm">ДА {yesPct}%</span>
            <span className="text-red-400 font-bold text-sm">НЕТ {noPct}%</span>
          </div>
          <div className="flex rounded-lg overflow-hidden h-3">
            <div className="yes-bar transition-all duration-500" style={{ width: `${yesPct}%` }} />
            <div className="no-bar transition-all duration-500" style={{ width: `${noPct}%` }} />
          </div>
          <div className="flex justify-between mt-2 text-xs text-white/40">
            <span>Множитель: ×{(1 / bet.yesPrice).toFixed(2)}</span>
            <span>Множитель: ×{(1 / bet.noPrice).toFixed(2)}</span>
          </div>
        </div>

        {/* My bets */}
        {myBets.length > 0 && (
          <div className="glass-card p-3">
            <div className="text-xs font-bold text-white/60 mb-2">📊 Ваши позиции</div>
            {myBets.map((b, i) => (
              <div key={i} className="flex items-center justify-between text-xs mb-1">
                <span className={`font-bold px-2 py-0.5 rounded ${b.side === 'yes' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                  {b.side === 'yes' ? '▲ ДА' : '▼ НЕТ'}
                </span>
                <span className="text-white font-semibold">{b.amount.toFixed(3)} TON</span>
                <span className="text-white/40">{b.shares.toFixed(4)} акций</span>
                {b.txHash && (
                  <span className="text-white/30 text-[9px]">#{b.txHash.slice(0, 8)}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 glass-card p-1 rounded-xl">
          {(['chart', 'comments', 'votes'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 text-xs py-1.5 rounded-lg font-semibold transition-all ${
                tab === t ? 'bg-purple-500/30 text-purple-300' : 'text-white/40'
              }`}
            >
              {t === 'chart' ? '📈 График' : t === 'comments' ? '💬 Чат' : '🗳 Голоса'}
            </button>
          ))}
        </div>

        {/* Chart tab */}
        {tab === 'chart' && (
          <div className="glass-card p-3">
            <div className="text-xs font-bold text-white/60 mb-2">Динамика вероятностей</div>
            {chartData.length > 1 ? (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }} unit="%" />
                  <Tooltip
                    contentStyle={{ background: '#0f0f2d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
                    formatter={(v: any, name: any) => [`${v}%`, name === 'yes' ? 'ДА' : 'НЕТ'] as [string, string]}
                  />
                  <Line type="monotone" dataKey="yes" stroke="#10b981" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="no" stroke="#ef4444" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-white/30 text-xs py-6">Недостаточно данных</div>
            )}

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="glass-card p-2 text-center">
                <div className="text-sm font-bold text-emerald-400">{bet.yesPool.toFixed(3)}</div>
                <div className="text-[9px] text-white/40 flex items-center justify-center gap-0.5">
                  <span className="text-[#0098EA]">💎</span>Пул ДА
                </div>
              </div>
              <div className="glass-card p-2 text-center">
                <div className="text-sm font-bold text-red-400">{bet.noPool.toFixed(3)}</div>
                <div className="text-[9px] text-white/40 flex items-center justify-center gap-0.5">
                  <span className="text-[#0098EA]">💎</span>Пул НЕТ
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Comments tab */}
        {tab === 'comments' && (
          <div className="glass-card p-3 space-y-3">
            <div className="flex gap-2">
              <input
                className="glass-input flex-1 rounded-xl px-3 py-2 text-sm"
                placeholder="Написать комментарий..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleComment()}
              />
              <button
                onClick={handleComment}
                className="btn-primary px-3 py-2 rounded-xl text-white text-sm font-bold"
              >
                →
              </button>
            </div>
            {bet.comments.map((c) => (
              <div key={c.id} className="flex gap-2">
                <span className="text-xl flex-shrink-0">{c.avatar}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">@{c.username}</span>
                    <span className="text-[10px] text-white/30">
                      {formatDistanceToNow(c.timestamp, { locale: ru, addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-xs text-white/70 mt-0.5">{c.text}</p>
                </div>
              </div>
            ))}
            {bet.comments.length === 0 && (
              <div className="text-center text-white/30 text-xs py-4">Будьте первым!</div>
            )}
          </div>
        )}

        {/* Votes tab */}
        {tab === 'votes' && (
          <div className="glass-card p-3 space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs font-bold text-white">🗳 Консенсус</span>
                <span className="text-[10px] text-white/40">{totalVotes} валидаторов</span>
              </div>
              <div className="flex rounded-lg overflow-hidden h-2">
                <div className="yes-bar" style={{ width: `${yesVotePct}%` }} />
                <div className="no-bar" style={{ width: `${100 - yesVotePct}%` }} />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-emerald-400 text-xs">ДА {yesVotePct}%</span>
                <span className="text-red-400 text-xs">{100 - yesVotePct}% НЕТ</span>
              </div>
            </div>

            {!hasVoted && bet.status === 'active' && (
              <div className="glass-card p-3 border border-purple-500/20">
                <div className="text-xs font-bold text-white mb-1">Проголосуйте как валидатор</div>
                <div className="text-[10px] text-white/40 mb-2">Правильные голоса вознаграждаются из комиссии</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => voteOnBet(bet.id, 'yes')}
                    className="btn-yes flex-1 py-2 rounded-xl text-sm font-bold"
                  >
                    ✅ ДА
                  </button>
                  <button
                    onClick={() => voteOnBet(bet.id, 'no')}
                    className="btn-no flex-1 py-2 rounded-xl text-sm font-bold"
                  >
                    ❌ НЕТ
                  </button>
                </div>
              </div>
            )}
            {hasVoted && (
              <div className="text-center text-emerald-400 text-xs py-2">✓ Вы проголосовали</div>
            )}

            {bet.votes.slice(0, 8).map((v, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span>{v.choice === 'yes' ? '✅' : '❌'}</span>
                  <span className="text-white">@{v.username}</span>
                </div>
                <span className="text-white/40">⚡ {v.reputation} реп.</span>
              </div>
            ))}
          </div>
        )}

        {/* Oracle info */}
        <div className="glass-card p-3">
          <div className="text-xs font-bold text-white/60 mb-1">🔮 Оракул разрешения</div>
          <div className="text-xs text-white/40">
            {bet.oracleType === 'price' && `Авто: цена ${bet.oracleSymbol?.toUpperCase()} ${bet.oracleDirection === 'above' ? 'выше' : 'ниже'} $${bet.oracleTarget?.toLocaleString()} (CoinGecko)`}
            {bet.oracleType === 'vote' && 'Консенсус голосования валидаторов (Proof of Stake)'}
            {bet.oracleType === 'manual' && 'Ручное подтверждение администратором'}
          </div>
        </div>

        {bet.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {bet.tags.map((tag) => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/30">#{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Betting panel */}
      {isActive && (
        <div className="flex-shrink-0 glass-card rounded-none px-4 py-3 animate-slideUp" style={{ borderRadius: '20px 20px 0 0', borderBottom: 'none' }}>
          {showSuccess && (
            <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-2 mb-2 animate-fadeIn">
              <span>🎉</span>
              <div>
                <div className="text-xs font-bold text-emerald-400">Транзакция отправлена!</div>
                <div className="text-[10px] text-white/50">Ставка записана в блокчейн TON</div>
              </div>
            </div>
          )}

          {txStatus === 'error' && (
            <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 rounded-xl p-2 mb-2">
              <span>❌</span>
              <div className="text-xs text-red-400">{txError}</div>
            </div>
          )}

          {/* Wallet required notice */}
          {!wallet && (
            <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl p-2 mb-2">
              <span className="text-[#0098EA]">💎</span>
              <div className="flex-1">
                <div className="text-xs text-white/70">Подключите TON кошелёк для ставки</div>
              </div>
            </div>
          )}

          {/* Side selection */}
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => setSelectedSide(selectedSide === 'yes' ? null : 'yes')}
              className={`btn-yes flex-1 py-2.5 rounded-xl text-sm font-black ${selectedSide === 'yes' ? 'active' : ''}`}
            >
              ▲ ДА {yesPct}% · ×{(1 / bet.yesPrice).toFixed(2)}
            </button>
            <button
              onClick={() => setSelectedSide(selectedSide === 'no' ? null : 'no')}
              className={`btn-no flex-1 py-2.5 rounded-xl text-sm font-black ${selectedSide === 'no' ? 'active' : ''}`}
            >
              ▼ НЕТ {noPct}% · ×{(1 / bet.noPrice).toFixed(2)}
            </button>
          </div>

          {selectedSide && (
            <div className="space-y-2">
              {/* Amount input */}
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={MIN_BET_TON}
                  max={Math.min(MAX_BET_TON, 10)}
                  step={0.05}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="flex-1"
                />
                <div className="flex items-center gap-1 glass-input rounded-lg px-2 py-1.5 min-w-[80px] justify-center">
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
                    className={`flex-1 text-[10px] py-1 rounded-lg font-bold transition-all ${
                      amount === v ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50' : 'glass-input text-white/50'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>

              {/* Return preview */}
              <div className="flex justify-between text-xs glass-card p-2 rounded-xl">
                <div className="space-y-0.5">
                  <div className="text-white/40">Ставка: <span className="text-white">{amount} TON</span></div>
                  <div className="text-white/40">Комиссия: <span className="text-yellow-400">{(amount * 0.05).toFixed(4)} TON</span></div>
                </div>
                <div className="text-right">
                  <div className="text-white/40 text-[10px]">Потенциал</div>
                  <div className="text-emerald-400 font-bold">+{potentialReturn.toFixed(3)} TON</div>
                </div>
              </div>

              {/* Place bet button */}
              <button
                onClick={handlePlaceBet}
                disabled={isTxPending || amount < MIN_BET_TON}
                className="btn-primary w-full py-3 rounded-xl text-white font-black text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isTxPending ? (
                  <>
                    <span className="animate-spin">⚡</span>
                    {txStatus === 'signing' ? 'Подписываем в кошельке...' : 'Отправляем...'}
                  </>
                ) : !wallet ? (
                  <>💎 Подключить TON Кошелёк</>
                ) : (
                  <>
                    💎 Поставить {amount} TON на {selectedSide === 'yes' ? 'ДА' : 'НЕТ'}
                  </>
                )}
              </button>

              <div className="text-center text-[10px] text-white/20">
                Транзакция в блокчейн TON · Мин. {MIN_BET_TON} TON
              </div>
            </div>
          )}

          {!selectedSide && (
            <div className="text-center text-white/30 text-xs py-1">
              👆 Выберите исход для ставки
            </div>
          )}
        </div>
      )}

      {bet.status === 'resolved' && (
        <div className="flex-shrink-0 glass-card rounded-none px-4 py-4 text-center" style={{ borderRadius: '20px 20px 0 0' }}>
          <div className={`text-xl font-black mb-1 ${bet.outcome === 'yes' ? 'text-emerald-400' : 'text-red-400'}`}>
            {bet.outcome === 'yes' ? '✅ ДА победило' : '❌ НЕТ победило'}
          </div>
          <div className="text-xs text-white/40">Ставка завершена</div>
        </div>
      )}
    </div>
  );
}

// Build TON comment payload (text comment cell in base64)
function buildCommentPayload(text: string): string {
  const encoded = new TextEncoder().encode(text);
  // Cell: 32 bits opcode 0x00000000 + text bytes
  const buf = new Uint8Array(4 + encoded.length);
  buf[0] = 0; buf[1] = 0; buf[2] = 0; buf[3] = 0; // opcode
  buf.set(encoded, 4);
  return btoa(String.fromCharCode(...buf));
}
