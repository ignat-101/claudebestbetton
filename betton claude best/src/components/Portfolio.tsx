import { useStore } from '../store/useStore';
import { TrendingUp, TrendingDown, Clock, CheckCircle, XCircle } from 'lucide-react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {
  AreaChart, Area, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

export function Portfolio() {
  const { bets, currentUser, transactions, setSelectedBetId, setActiveTab } = useStore();

  const myBetIds = new Set([...currentUser.activeBets, ...currentUser.resolvedBets]);
  const myBets = bets.filter((b) => myBetIds.has(b.id) || b.participants.some((p) => p.userId === currentUser.id));

  const activeBets = myBets.filter((b) => b.status === 'active' || b.status === 'voting');
  const resolvedBets = myBets.filter((b) => b.status === 'resolved');

  const pnl = currentUser.totalWon - currentUser.totalLost;
  const roi = currentUser.totalWagered > 0
    ? ((pnl / currentUser.totalWagered) * 100).toFixed(1)
    : '0.0';

  // Portfolio chart data (cumulative P&L simulation)
  const chartData = Array.from({ length: 14 }, (_, i) => ({
    day: `${i + 1}д`,
    balance: 3000 + Math.sin(i * 0.8) * 500 + i * 150 + Math.random() * 200,
  }));

  // Allocation pie
  const pieData = [
    { name: 'Крипто', value: 60, color: '#f59e0b' },
    { name: 'Спорт', value: 25, color: '#10b981' },
    { name: 'Политика', value: 10, color: '#8b5cf6' },
    { name: 'Другое', value: 5, color: '#6b7280' },
  ];

  const myTxs = transactions.filter((t) => t.userId === currentUser.id).slice(0, 10);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 px-4 pt-4 pb-2">
        <h1 className="text-xl font-black text-white">Портфолио</h1>
        <p className="text-xs text-white/40">Ваши ставки и статистика</p>
      </div>

      <div className="flex-1 overflow-y-auto scroll-content px-4 pb-4">
        {/* P&L Banner */}
        <div className={`glass-card p-5 mb-4 border ${pnl >= 0 ? 'border-emerald-500/30' : 'border-red-500/30'}`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-white/40 mb-1">Общий P&L</p>
              <div className={`text-3xl font-black ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {pnl >= 0 ? '+' : ''}{pnl.toLocaleString()} ⭐
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/40 mb-1">ROI</p>
              <div className={`text-2xl font-black ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {pnl >= 0 ? '+' : ''}{roi}%
              </div>
            </div>
          </div>

          {/* Portfolio chart */}
          <ResponsiveContainer width="100%" height={80}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={pnl >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={pnl >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="balance"
                stroke={pnl >= 0 ? '#10b981' : '#ef4444'}
                fill="url(#pnlGrad)"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="glass-card p-3 text-center">
            <div className="text-lg font-black text-yellow-400">{currentUser.totalWagered.toLocaleString()} ⭐</div>
            <div className="text-[10px] text-white/40 mt-0.5">Всего поставлено</div>
          </div>
          <div className="glass-card p-3 text-center">
            <div className="text-lg font-black text-emerald-400">{currentUser.totalWon.toLocaleString()} ⭐</div>
            <div className="text-[10px] text-white/40 mt-0.5">Всего выиграно</div>
          </div>
          <div className="glass-card p-3 text-center">
            <div className="text-lg font-black text-purple-400">{myBets.length}</div>
            <div className="text-[10px] text-white/40 mt-0.5">Всего ставок</div>
          </div>
          <div className="glass-card p-3 text-center">
            <div className="text-lg font-black text-blue-400">{currentUser.reputation}</div>
            <div className="text-[10px] text-white/40 mt-0.5">Репутация</div>
          </div>
        </div>

        {/* Allocation */}
        <div className="glass-card p-4 mb-4">
          <p className="text-xs font-bold text-white/60 mb-3">Распределение по категориям</p>
          <div className="flex items-center gap-4">
            <PieChart width={80} height={80}>
              <Pie data={pieData} cx={35} cy={35} innerRadius={20} outerRadius={38} paddingAngle={2} dataKey="value">
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
            <div className="flex-1 space-y-1.5">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                    <span className="text-white/60">{item.name}</span>
                  </div>
                  <span className="text-white/80 font-semibold">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Active bets */}
        {activeBets.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={14} className="text-blue-400" />
              <span className="text-xs font-bold text-blue-400">АКТИВНЫЕ ({activeBets.length})</span>
            </div>
            {activeBets.map((bet) => {
              const myPos = bet.participants.filter((p) => p.userId === currentUser.id);
              const totalIn = myPos.reduce((s, p) => s + p.amount, 0);
              const currentVal = myPos.reduce((s, p) => {
                const currentPrice = p.side === 'yes' ? bet.yesPrice : bet.noPrice;
                return s + p.shares * (1 / currentPrice);
              }, 0);
              const pnlPos = currentVal - totalIn;

              return (
                <div
                  key={bet.id}
                  className="glass-card p-3 mb-2 cursor-pointer"
                  onClick={() => { setSelectedBetId(bet.id); setActiveTab('bets'); }}
                >
                  <p className="text-sm font-semibold text-white line-clamp-1 mb-2">{bet.title}</p>
                  <div className="flex items-center justify-between">
                    <div className="text-xs">
                      <span className="text-white/40">Поставлено: </span>
                      <span className="text-yellow-400 font-bold">{totalIn} ⭐</span>
                    </div>
                    <div className={`text-xs font-bold ${pnlPos >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {pnlPos >= 0 ? <TrendingUp size={12} className="inline mr-1" /> : <TrendingDown size={12} className="inline mr-1" />}
                      {pnlPos >= 0 ? '+' : ''}{Math.round(pnlPos)} ⭐
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden flex mt-2">
                    <div className="yes-bar rounded-l-full" style={{ width: `${Math.round(bet.yesPrice * 100)}%` }} />
                    <div className="no-bar rounded-r-full flex-1" />
                  </div>
                  <div className="flex justify-between text-[10px] text-white/30 mt-1">
                    <span>ДА {Math.round(bet.yesPrice * 100)}%</span>
                    <span>{Math.round(bet.noPrice * 100)}% НЕТ</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Resolved bets */}
        {resolvedBets.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={14} className="text-emerald-400" />
              <span className="text-xs font-bold text-emerald-400">ЗАВЕРШЕННЫЕ</span>
            </div>
            {resolvedBets.map((bet) => {
              const myPos = bet.participants.filter((p) => p.userId === currentUser.id);
              const totalIn = myPos.reduce((s, p) => s + p.amount, 0);
              const won = myPos.some((p) => p.side === bet.outcome);

              return (
                <div key={bet.id} className="glass-card p-3 mb-2 flex items-center gap-3">
                  {won
                    ? <CheckCircle size={18} className="text-emerald-400 flex-shrink-0" />
                    : <XCircle size={18} className="text-red-400 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white line-clamp-1">{bet.title}</p>
                    <p className={`text-[11px] mt-0.5 ${won ? 'text-emerald-400' : 'text-red-400'}`}>
                      {won ? '✓ Победа' : '✗ Проигрыш'} • {totalIn} ⭐ поставлено
                    </p>
                  </div>
                  <div className={`text-xs font-bold ${won ? 'text-emerald-400' : 'text-red-400'}`}>
                    {bet.outcome === 'yes' ? 'ДА' : 'НЕТ'} ✓
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Transactions */}
        {myTxs.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-bold text-white/60 mb-3">История транзакций</p>
            {myTxs.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-2.5 border-b border-white/5">
                <div>
                  <p className="text-xs text-white/70">{tx.description}</p>
                  <p className="text-[10px] text-white/30 mt-0.5">
                    {formatDistanceToNow(tx.timestamp, { locale: ru, addSuffix: true })}
                  </p>
                </div>
                <div className={`text-sm font-bold ${tx.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {tx.amount >= 0 ? '+' : ''}{tx.amount} ⭐
                </div>
              </div>
            ))}
          </div>
        )}

        {myBets.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📊</div>
            <p className="text-white/40 text-sm">Нет активных ставок</p>
            <p className="text-white/20 text-xs mt-1">Перейдите в раздел "Ставки" для начала</p>
          </div>
        )}
      </div>
    </div>
  );
}
