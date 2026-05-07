import { useStore } from '../store/useStore';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

export function Portfolio() {
  const { bets, currentUser, transactions, setSelectedBetId, setActiveTab } = useStore();

  const activeBetItems = bets.filter((b) => currentUser.activeBets.includes(b.id));
  const resolvedBetItems = bets.filter((b) => currentUser.resolvedBets.includes(b.id));

  const totalWagered = currentUser.totalWagered;
  const totalWon = currentUser.totalWon;
  const pnl = totalWon - totalWagered;
  const winRate = resolvedBetItems.length > 0
    ? Math.round((resolvedBetItems.filter((b) => {
        const myBet = b.participants.find((p) => p.userId === currentUser.id);
        return myBet && b.outcome === myBet.side;
      }).length / resolvedBetItems.length) * 100)
    : 0;

  const confirmedTxCount = transactions.filter((t) => t.onChainConfirmed).length;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 px-4 pt-4 pb-3">
        <h1 className="text-xl font-black text-white mb-3">📊 Портфолио</h1>

        {/* Security status */}
        <div className="glass-card p-2.5 mb-3 border border-emerald-500/20">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse-glow" />
            <span className="text-[10px] text-emerald-400 font-bold">
              {confirmedTxCount} подтверждённых on-chain транзакций
            </span>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="glass-card p-3">
            <div className="text-xs text-white/40 mb-1">Поставлено</div>
            <div className="flex items-center gap-1">
              <span className="text-[#0098EA] text-sm">💎</span>
              <span className="text-white font-bold">{totalWagered.toFixed(3)} TON</span>
            </div>
          </div>
          <div className="glass-card p-3">
            <div className="text-xs text-white/40 mb-1">Выиграно</div>
            <div className="flex items-center gap-1">
              <span className="text-[#0098EA] text-sm">💎</span>
              <span className={`font-bold ${totalWon >= totalWagered ? 'text-emerald-400' : 'text-white'}`}>
                {totalWon.toFixed(3)} TON
              </span>
            </div>
          </div>
          <div className="glass-card p-3">
            <div className="text-xs text-white/40 mb-1">P&L</div>
            <div className={`font-bold text-sm ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {pnl >= 0 ? '+' : ''}{pnl.toFixed(3)} TON
            </div>
          </div>
          <div className="glass-card p-3">
            <div className="text-xs text-white/40 mb-1">Win Rate</div>
            <div className="font-bold text-sm text-white">{winRate}%</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scroll-content px-4 pb-4 space-y-4">
        {/* Active bets */}
        <div>
          <div className="text-xs font-bold text-white/60 mb-2">⚡ Активные ставки ({activeBetItems.length})</div>
          {activeBetItems.length === 0 ? (
            <div className="glass-card p-6 text-center">
              <div className="text-3xl mb-2">🎲</div>
              <div className="text-xs text-white/40">Нет активных ставок</div>
              <div className="text-[10px] text-white/25 mt-1">Все ставки реальные — требуют TON кошелёк</div>
              <button
                onClick={() => setActiveTab('bets')}
                className="btn-primary mt-3 px-4 py-2 rounded-xl text-white text-xs font-bold"
              >
                Смотреть ставки
              </button>
            </div>
          ) : (
            activeBetItems.map((bet) => {
              const myBets = bet.participants.filter((p) => p.userId === currentUser.id);
              const totalAmount = myBets.reduce((s, b) => s + b.amount, 0);
              const side = myBets[0]?.side;
              const currentPrice = side === 'yes' ? bet.yesPrice : bet.noPrice;
              const avgPrice = myBets[0]?.avgPrice || 0.5;
              const priceDelta = currentPrice - avgPrice;
              const confirmedBets = myBets.filter((b) => b.confirmed);

              return (
                <div key={bet.id} className="glass-card p-3 bet-card mb-2" onClick={() => setSelectedBetId(bet.id)}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-bold text-white line-clamp-2">{bet.title}</h3>
                    </div>
                    <div className={`ml-2 flex-shrink-0 px-2 py-0.5 rounded text-[9px] font-bold ${side === 'yes' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {side === 'yes' ? '▲ ДА' : '▼ НЕТ'}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/40">💎 {totalAmount.toFixed(3)} TON</span>
                    <span className={`font-semibold ${priceDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {priceDelta >= 0 ? '+' : ''}{(priceDelta * 100).toFixed(1)}%
                    </span>
                    <span className="text-white/30 text-[10px]">
                      {formatDistanceToNow(bet.resolveAt, { locale: ru, addSuffix: true })}
                    </span>
                  </div>
                  {confirmedBets.length > 0 && (
                    <div className="mt-1 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                      <span className="text-[9px] text-emerald-400">{confirmedBets.length} on-chain подтверждено</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Resolved bets */}
        {resolvedBetItems.length > 0 && (
          <div>
            <div className="text-xs font-bold text-white/60 mb-2">✓ История ({resolvedBetItems.length})</div>
            {resolvedBetItems.map((bet) => {
              const myBets = bet.participants.filter((p) => p.userId === currentUser.id);
              const totalAmount = myBets.reduce((s, b) => s + b.amount, 0);
              const side = myBets[0]?.side;
              const won = bet.outcome === side;
              return (
                <div key={bet.id} className="glass-card p-3 mb-2">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="text-xs font-bold text-white flex-1 line-clamp-1 mr-2">{bet.title}</h3>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${won ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
                      {won ? '🏆 Победа' : '😔 Проигрыш'}
                    </span>
                  </div>
                  <div className="text-[10px] text-white/40">
                    💎 {totalAmount.toFixed(3)} TON · {side === 'yes' ? 'ДА' : 'НЕТ'}
                  </div>
                  {bet.posSnapshotHash && (
                    <div className="text-[9px] text-white/20 font-mono mt-0.5">
                      PoS: {bet.posSnapshotHash.slice(0, 12)}...
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Transactions */}
        {transactions.length > 0 && (
          <div>
            <div className="text-xs font-bold text-white/60 mb-2">📋 Транзакции</div>
            <div className="glass-card divide-y divide-white/5">
              {transactions.slice(0, 10).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {tx.type === 'bet' ? '🎲' : tx.type === 'win' ? '🏆' : tx.type === 'deposit' ? '⬇️' : '💸'}
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-white">{tx.description}</div>
                      <div className="text-[10px] text-white/30 flex items-center gap-1">
                        {new Date(tx.timestamp).toLocaleDateString('ru')}
                        {tx.txHash && (
                          <a
                            href={`https://tonscan.org/tx/${tx.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 font-mono hover:underline"
                          >
                            #{tx.txHash.slice(0, 8)}↗
                          </a>
                        )}
                        {tx.onChainConfirmed && (
                          <span className="text-emerald-400">✓</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={`text-sm font-bold ${tx.type === 'win' ? 'text-emerald-400' : tx.type === 'bet' ? 'text-red-400' : 'text-white'}`}>
                    {tx.type === 'win' ? '+' : tx.type === 'bet' ? '-' : ''}{tx.amount.toFixed(3)}
                    <span className="text-[10px] text-[#0098EA] ml-0.5">TON</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {transactions.length === 0 && activeBetItems.length === 0 && (
          <div className="glass-card p-6 text-center">
            <div className="text-3xl mb-2">📊</div>
            <div className="text-xs text-white/40">Нет транзакций</div>
            <div className="text-[10px] text-white/20 mt-1">Все транзакции реальные — хранятся в TON блокчейне</div>
          </div>
        )}
      </div>
    </div>
  );
}
