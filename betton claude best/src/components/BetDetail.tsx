import { useState } from 'react';
import { useStore } from '../store/useStore';
import {
  ArrowLeft, Users, Clock, Star,
  Shield, ChevronRight, Zap, Share2, CheckCircle
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { formatDistanceToNow, format } from 'date-fns';
import { ru } from 'date-fns/locale';

export function BetDetail() {
  const { selectedBetId, bets, currentUser, setSelectedBetId, placeBet, voteOnBet, addComment } = useStore();
  const bet = bets.find((b) => b.id === selectedBetId);

  const [selectedSide, setSelectedSide] = useState<'yes' | 'no' | null>(null);
  const [amount, setAmount] = useState(100);
  const [comment, setComment] = useState('');
  const [tab, setTab] = useState<'chart' | 'comments' | 'votes'>('chart');
  const [showSuccess, setShowSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!bet) return null;

  const yesPercent = Math.round(bet.yesPrice * 100);
  const noPercent = Math.round(bet.noPrice * 100);
  const hasVoted = currentUser.votedBets.includes(bet.id);
  const myBets = bet.participants.filter((p) => p.userId === currentUser.id);
  const isActive = bet.status === 'active' && bet.adminApproved;

  const timeLeft = formatDistanceToNow(bet.resolveAt, { locale: ru, addSuffix: true });

  // Calculate potential return
  const potentialReturn = selectedSide && amount > 0
    ? Math.floor(amount / (selectedSide === 'yes' ? bet.yesPrice : bet.noPrice) * 0.95)
    : 0;

  const handleBet = () => {
    if (!selectedSide || amount <= 0) return;
    const success = placeBet(bet.id, selectedSide, amount);
    if (success) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2500);
      setSelectedSide(null);
    }
  };

  const handleVote = (choice: 'yes' | 'no') => {
    voteOnBet(bet.id, choice);
  };

  const handleComment = () => {
    if (!comment.trim()) return;
    addComment(bet.id, comment.trim());
    setComment('');
  };

  const handleShare = () => {
    const text = `🎯 TON FlashBet: "${bet.title}"\nДА: ${yesPercent}% / НЕТ: ${noPercent}%\n\nСтавь прямо сейчас!`;
    if (navigator.share) {
      navigator.share({ text, title: 'TON FlashBet' }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const chartData = bet.priceHistory.slice(-24).map((p) => ({
    time: format(p.time, 'HH:mm'),
    yes: Math.round(p.yesPrice * 100),
    no: Math.round(p.noPrice * 100),
    volume: p.volume,
  }));

  const yesVotes = bet.votes.filter((v) => v.choice === 'yes').length;
  const totalVotes = bet.votes.length;
  const yesVotePct = totalVotes > 0 ? Math.round((yesVotes / totalVotes) * 100) : 50;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-mesh animate-slideUp">
      {/* Blobs */}
      <div className="blob w-64 h-64 bg-purple-500 top-0 right-0" />
      <div className="blob w-48 h-48 bg-blue-500 bottom-20 left-0" />

      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setSelectedBetId(null)}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-sm">Назад</span>
          </button>
          <div className="flex items-center gap-2">
            <button onClick={handleShare} className="glass rounded-full p-2">
              {copied ? <CheckCircle size={16} className="text-emerald-400" /> : <Share2 size={16} className="text-white/60" />}
            </button>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-lg font-bold text-white leading-snug mb-2">{bet.title}</h2>
        <p className="text-xs text-white/50 mb-3">{bet.description}</p>

        {/* Stats row */}
        <div className="flex items-center gap-4 text-xs text-white/50">
          <div className="flex items-center gap-1">
            <Star size={11} className="text-yellow-400" />
            <span className="text-yellow-400 font-semibold">{bet.totalVolume.toLocaleString()} ⭐</span>
          </div>
          <div className="flex items-center gap-1">
            <Users size={11} />
            <span>{bet.participants.length} ставок</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={11} />
            <span>{timeLeft}</span>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto scroll-content px-4 pb-4">
        {/* Probability display */}
        <div className="glass-card p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-center flex-1">
              <div className="text-3xl font-black text-emerald-400">{yesPercent}%</div>
              <div className="text-xs text-white/50 mt-0.5">Вероятность ДА</div>
            </div>
            <div className="w-px h-12 bg-white/10" />
            <div className="text-center flex-1">
              <div className="text-3xl font-black text-red-400">{noPercent}%</div>
              <div className="text-xs text-white/50 mt-0.5">Вероятность НЕТ</div>
            </div>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden flex gap-0.5">
            <div className="yes-bar rounded-l-full transition-all duration-700" style={{ width: `${yesPercent}%` }} />
            <div className="no-bar rounded-r-full flex-1" />
          </div>
        </div>

        {/* My bets */}
        {myBets.length > 0 && (
          <div className="glass-card p-3 mb-4 border border-purple-500/20">
            <p className="text-xs font-bold text-purple-300 mb-2">📊 Ваши позиции</p>
            {myBets.map((b, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className={b.side === 'yes' ? 'text-emerald-400' : 'text-red-400'}>
                  {b.side === 'yes' ? '▲ ДА' : '▼ НЕТ'}
                </span>
                <span className="text-white/70">{b.amount} ⭐ @ {Math.round(b.avgPrice * 100)}¢</span>
                <span className="text-white/50">{b.shares.toFixed(2)} акций</span>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 glass-card mb-4">
          {(['chart', 'comments', 'votes'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
                tab === t
                  ? 'bg-purple-600/40 text-purple-200 border border-purple-500/40'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {t === 'chart' && '📈 График'}
              {t === 'comments' && `💬 ${bet.comments.length}`}
              {t === 'votes' && `🗳 ${bet.votes.length}`}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'chart' && (
          <div className="glass-card p-3 mb-4">
            <p className="text-xs font-semibold text-white/60 mb-3">Динамика вероятностей</p>
            {chartData.length > 1 ? (
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="yesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="noGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} unit="%" />
                  <Tooltip
                    contentStyle={{ background: 'rgba(10,10,30,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
                    formatter={(v: unknown, name: unknown) => [`${v}%`, name === 'yes' ? 'ДА' : 'НЕТ']}
                  />
                  <Area type="monotone" dataKey="yes" stroke="#10b981" fill="url(#yesGrad)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="no" stroke="#ef4444" fill="url(#noGrad)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-40 flex items-center justify-center text-white/30 text-sm">
                Недостаточно данных для графика
              </div>
            )}

            {/* Volume bars */}
            <div className="mt-3 pt-3 border-t border-white/5">
              <p className="text-xs text-white/40 mb-2">Пулы ликвидности</p>
              <div className="flex gap-3">
                <div className="flex-1 glass rounded-xl p-3 text-center">
                  <div className="text-emerald-400 font-bold">{bet.yesPool.toLocaleString()} ⭐</div>
                  <div className="text-[10px] text-white/40 mt-0.5">Пул ДА</div>
                </div>
                <div className="flex-1 glass rounded-xl p-3 text-center">
                  <div className="text-red-400 font-bold">{bet.noPool.toLocaleString()} ⭐</div>
                  <div className="text-[10px] text-white/40 mt-0.5">Пул НЕТ</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'comments' && (
          <div className="mb-4">
            {/* Add comment */}
            <div className="glass-card p-3 mb-3">
              <div className="flex gap-2">
                <input
                  className="glass-input flex-1 rounded-xl px-3 py-2 text-sm"
                  placeholder="Ваш прогноз..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                />
                <button onClick={handleComment} className="btn-primary px-4 py-2 rounded-xl text-white text-sm font-semibold">
                  →
                </button>
              </div>
            </div>
            {bet.comments.map((c) => (
              <div key={c.id} className="glass-card p-3 mb-2 animate-fadeIn">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">{c.avatar}</span>
                  <span className="text-xs font-bold text-purple-300">@{c.username}</span>
                  <span className="text-[10px] text-white/30">
                    {formatDistanceToNow(c.timestamp, { locale: ru, addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-white/80">{c.text}</p>
                <div className="flex items-center gap-2 mt-2">
                  <button className="text-[11px] text-white/30 hover:text-white/60 flex items-center gap-1">
                    👍 {c.likes}
                  </button>
                </div>
              </div>
            ))}
            {bet.comments.length === 0 && (
              <div className="text-center py-8 text-white/30 text-sm">
                Первым оставьте комментарий!
              </div>
            )}
          </div>
        )}

        {tab === 'votes' && (
          <div className="mb-4">
            {/* Vote consensus */}
            <div className="glass-card p-4 mb-3">
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-bold text-white/70">🗳 Консенсус сообщества</p>
                <p className="text-xs text-white/40">{totalVotes} валидаторов</p>
              </div>
              <div className="h-2 rounded-full overflow-hidden flex mb-2">
                <div className="yes-bar rounded-l-full transition-all" style={{ width: `${yesVotePct}%` }} />
                <div className="no-bar rounded-r-full flex-1" />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-emerald-400 font-semibold">ДА {yesVotePct}%</span>
                <span className="text-red-400 font-semibold">{100 - yesVotePct}% НЕТ</span>
              </div>
            </div>

            {/* Vote action */}
            {!hasVoted && bet.status === 'active' && (
              <div className="glass-card p-4 mb-3 border border-purple-500/20">
                <p className="text-sm font-bold text-white mb-1">Проголосуйте как валидатор</p>
                <p className="text-xs text-white/50 mb-3">
                  Правильные голоса вознаграждаются ⭐ Stars из комиссии платформы
                </p>
                <div className="flex gap-3">
                  <button onClick={() => handleVote('yes')} className="btn-yes flex-1 py-2.5 rounded-xl font-bold text-sm">
                    ✅ ДА
                  </button>
                  <button onClick={() => handleVote('no')} className="btn-no flex-1 py-2.5 rounded-xl font-bold text-sm">
                    ❌ НЕТ
                  </button>
                </div>
              </div>
            )}
            {hasVoted && (
              <div className="glass-card p-3 mb-3 border border-emerald-500/20 text-center">
                <Shield size={20} className="text-emerald-400 mx-auto mb-1" />
                <p className="text-sm text-emerald-300 font-semibold">Вы проголосовали</p>
                <p className="text-xs text-white/40">Ждите результата для получения награды</p>
              </div>
            )}

            {/* Votes list */}
            {bet.votes.slice(0, 8).map((v, i) => (
              <div key={i} className="glass-card p-3 mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={v.choice === 'yes' ? 'text-emerald-400' : 'text-red-400'}>
                    {v.choice === 'yes' ? '✅' : '❌'}
                  </span>
                  <span className="text-sm text-white/70">@{v.username}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-white/40">
                  <span>⚡ {v.reputation} реп.</span>
                  <span>{formatDistanceToNow(v.timestamp, { locale: ru, addSuffix: true })}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Oracle info */}
        <div className="glass-card p-3 mb-4 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={14} className="text-blue-400" />
            <span className="text-xs font-bold text-blue-300">Оракул разрешения</span>
          </div>
          <p className="text-xs text-white/50">
            {bet.oracleType === 'price' && `Автоматически: цена ${bet.oracleSymbol?.toUpperCase()} ${bet.oracleDirection === 'above' ? 'выше' : 'ниже'} $${bet.oracleTarget?.toLocaleString()} (CoinGecko API)`}
            {bet.oracleType === 'vote' && 'Консенсус голосования: валидаторы определяют результат (Proof of Stake)'}
            {bet.oracleType === 'manual' && 'Ручное подтверждение администратором платформы'}
          </p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {bet.tags.map((tag) => (
            <span key={tag} className="chip"># {tag}</span>
          ))}
        </div>
      </div>

      {/* Bottom betting panel */}
      {isActive && (
        <div className="flex-shrink-0 p-4 glass border-t border-white/5">
          {showSuccess && (
            <div className="mb-3 glass-card p-3 border border-emerald-500/30 text-center animate-fadeIn">
              <div className="text-emerald-400 font-bold">🎉 Ставка принята!</div>
              <div className="text-xs text-white/50">Ваши акции добавлены в портфолио</div>
            </div>
          )}

          {/* Side selection */}
          <div className="flex gap-3 mb-3">
            <button
              onClick={() => setSelectedSide('yes')}
              className={`btn-yes flex-1 py-3 rounded-xl font-bold text-sm ${selectedSide === 'yes' ? 'active' : ''}`}
            >
              ✅ ДА — {yesPercent}¢
            </button>
            <button
              onClick={() => setSelectedSide('no')}
              className={`btn-no flex-1 py-3 rounded-xl font-bold text-sm ${selectedSide === 'no' ? 'active' : ''}`}
            >
              ❌ НЕТ — {noPercent}¢
            </button>
          </div>

          {selectedSide && (
            <div className="animate-fadeIn">
              {/* Amount */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1">
                  <input
                    type="range"
                    min={10}
                    max={Math.min(1000, currentUser.starsBalance)}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div className="glass rounded-xl px-3 py-2 text-center min-w-[80px]">
                  <div className="text-yellow-400 font-bold text-sm">{amount} ⭐</div>
                </div>
              </div>

              {/* Quick amounts */}
              <div className="flex gap-2 mb-3">
                {[50, 100, 250, 500].map((v) => (
                  <button
                    key={v}
                    onClick={() => setAmount(Math.min(v, currentUser.starsBalance))}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      amount === v ? 'bg-purple-600/40 text-purple-200 border border-purple-500/40' : 'glass text-white/50'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>

              {/* Return preview */}
              <div className="flex items-center justify-between mb-3 glass-card p-2.5">
                <div className="text-xs text-white/50">
                  <div>Ставка: <span className="text-yellow-400">{amount} ⭐</span></div>
                  <div>Комиссия: <span className="text-white/40">{Math.floor(amount * 0.05)} ⭐ (5%)</span></div>
                </div>
                <ChevronRight size={14} className="text-white/20" />
                <div className="text-xs text-right">
                  <div className="text-white/50">Потенциал:</div>
                  <div className="text-emerald-400 font-bold">+{potentialReturn} ⭐</div>
                </div>
              </div>

              <button
                onClick={handleBet}
                disabled={currentUser.starsBalance < amount}
                className="btn-primary w-full py-3 rounded-xl text-white font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {currentUser.starsBalance < amount
                  ? '❌ Недостаточно Stars'
                  : `⚡ Поставить ${amount} ⭐ на ${selectedSide === 'yes' ? 'ДА' : 'НЕТ'}`}
              </button>
            </div>
          )}

          {!selectedSide && (
            <div className="text-center text-xs text-white/30 py-1">
              Выберите исход для ставки
            </div>
          )}
        </div>
      )}

      {bet.status === 'resolved' && (
        <div className="flex-shrink-0 p-4 glass border-t border-white/5 text-center">
          <div className={`text-lg font-bold mb-1 ${bet.outcome === 'yes' ? 'text-emerald-400' : 'text-red-400'}`}>
            {bet.outcome === 'yes' ? '✅ ДА победило' : '❌ НЕТ победило'}
          </div>
          <p className="text-xs text-white/40">Ставка завершена</p>
        </div>
      )}
    </div>
  );
}
