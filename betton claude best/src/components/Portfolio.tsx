import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { SECURITY_CONFIG } from '../security/proofOfStake';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

export function Portfolio() {
  const { currentUser, bets, transactions, setSelectedBetId, setActiveTab } = useStore();

  const activeBetObjects = useMemo(() =>
    bets.filter(b => currentUser.activeBets.includes(b.id)),
    [bets, currentUser.activeBets]
  );

  const resolvedBetObjects = useMemo(() =>
    bets.filter(b => currentUser.resolvedBets.includes(b.id)).slice(0, 10),
    [bets, currentUser.resolvedBets]
  );

  const myTxs = transactions.filter(t => t.userId === currentUser.id).slice(0, 15);
  const roi = currentUser.totalWagered > 0
    ? ((currentUser.totalWon - currentUser.totalWagered) / currentUser.totalWagered * 100).toFixed(1)
    : '0.0';
  const roiPos = parseFloat(roi) >= 0;

  return (
    <div className="flex flex-col h-full bg-mesh">
      <div className="flex-shrink-0 px-4 pt-4 pb-2">
        <h1 className="text-xl font-black text-white mb-1">Портфель</h1>
        <p className="text-[11px] text-white/40">Ваши ставки и история</p>
      </div>

      <div className="flex-1 overflow-y-auto scroll-content px-4 pb-4 space-y-3">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Поставлено', value: `${currentUser.totalWagered.toFixed(2)} TON`, color: 'text-white', sub: '' },
            { label: 'Выиграно', value: `${currentUser.totalWon.toFixed(2)} TON`, color: 'text-emerald-400', sub: '' },
            { label: 'ROI', value: `${roiPos ? '+' : ''}${roi}%`, color: roiPos ? 'text-emerald-400' : 'text-red-400', sub: '' },
            { label: 'Репутация', value: `${currentUser.reputation}`, color: 'text-purple-400', sub: `+5 за голос` },
          ].map(s => (
            <div key={s.label} className="glass-card p-3 rounded-xl">
              <p className="text-[10px] text-white/40 mb-1">{s.label}</p>
              <p className={`text-base font-black ${s.color}`}>{s.value}</p>
              {s.sub && <p className="text-[10px] text-white/30">{s.sub}</p>}
            </div>
          ))}
        </div>

        {/* Fee breakdown */}
        <div className="glass-card p-3 rounded-xl">
          <p className="text-[10px] text-white/40 mb-2 font-semibold uppercase tracking-wider">Структура платежей</p>
          <div className="space-y-1">
            {[
              { label: 'Победителям', pct: `${(1 - SECURITY_CONFIG.PLATFORM_FEE_PCT - SECURITY_CONFIG.VALIDATOR_REWARD_PCT - SECURITY_CONFIG.REFERRAL_PCT) * 100}%`, color: 'bg-emerald-500' },
              { label: 'Платформа', pct: `${SECURITY_CONFIG.PLATFORM_FEE_PCT * 100}%`, color: 'bg-purple-500' },
              { label: 'Валидаторы PoS', pct: `${SECURITY_CONFIG.VALIDATOR_REWARD_PCT * 100}%`, color: 'bg-blue-500' },
              { label: 'Рефералы', pct: `${SECURITY_CONFIG.REFERRAL_PCT * 100}%`, color: 'bg-amber-500' },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${f.color}`} />
                <span className="text-[11px] text-white/60 flex-1">{f.label}</span>
                <span className="text-[11px] font-bold text-white">{f.pct}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Active bets */}
        {activeBetObjects.length > 0 && (
          <div>
            <p className="text-[10px] text-white/30 font-semibold uppercase tracking-wider mb-2">⚡ Активные ставки</p>
            {activeBetObjects.map(b => {
              const myBet = b.participants.find(p => p.userId === currentUser.id);
              return (
                <div key={b.id} className="glass-card p-3 rounded-xl mb-2 cursor-pointer bet-card"
                  onClick={() => { setSelectedBetId(b.id); setActiveTab('bets'); }}>
                  <p className="text-[12px] font-bold text-white line-clamp-1 mb-1">{b.title}</p>
                  <div className="flex justify-between text-[10px]">
                    <span className={myBet?.side === 'yes' ? 'text-emerald-400' : 'text-red-400'}>
                      {myBet?.side === 'yes' ? '✅ ДА' : '❌ НЕТ'} · {myBet?.amount} TON
                    </span>
                    <span className="text-white/30">⏱ {formatDistanceToNow(b.resolveAt, { locale: ru, addSuffix: true })}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Resolved */}
        {resolvedBetObjects.length > 0 && (
          <div>
            <p className="text-[10px] text-white/30 font-semibold uppercase tracking-wider mb-2">✓ Завершённые</p>
            {resolvedBetObjects.map(b => {
              const myBet = b.participants.find(p => p.userId === currentUser.id);
              const won = myBet?.side === b.outcome;
              return (
                <div key={b.id} className="glass-card p-3 rounded-xl mb-2">
                  <p className="text-[12px] font-bold text-white line-clamp-1 mb-1">{b.title}</p>
                  <div className="flex justify-between text-[10px]">
                    <span className={won ? 'text-emerald-400' : 'text-red-400'}>
                      {won ? '🏆 Победа' : '😔 Проигрыш'} · {myBet?.side === 'yes' ? 'ДА' : 'НЕТ'}
                    </span>
                    <span className="text-white/30">Итог: {b.outcome === 'yes' ? 'ДА' : 'НЕТ'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Transactions */}
        {myTxs.length > 0 && (
          <div>
            <p className="text-[10px] text-white/30 font-semibold uppercase tracking-wider mb-2">📋 Транзакции</p>
            {myTxs.map(tx => (
              <div key={tx.id} className="glass-card px-3 py-2.5 rounded-xl mb-1.5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-white font-medium line-clamp-1">{tx.description}</p>
                  <div className="flex items-center gap-2 text-[10px] text-white/30 mt-0.5">
                    <span>{new Date(tx.timestamp).toLocaleDateString('ru')}</span>
                    {tx.txHash && <span className="text-blue-400/60">#{tx.txHash.slice(0,8)}...</span>}
                    {tx.onChainConfirmed && <span className="text-emerald-400/60">✓ on-chain</span>}
                  </div>
                </div>
                <span className={`text-[12px] font-bold ${tx.type === 'win' ? 'text-emerald-400' : tx.type === 'bet' ? 'text-white/60' : 'text-blue-400'}`}>
                  {tx.type === 'win' ? '+' : tx.type === 'bet' ? '-' : ''}{tx.amount.toFixed(3)} TON
                </span>
              </div>
            ))}
          </div>
        )}

        {activeBetObjects.length === 0 && resolvedBetObjects.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🎯</div>
            <p className="text-white/40 text-sm mb-4">Ставок пока нет</p>
            <button onClick={() => setActiveTab('bets')} className="btn-primary text-white text-sm font-bold px-5 py-2.5 rounded-xl">
              Перейти к ставкам
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
