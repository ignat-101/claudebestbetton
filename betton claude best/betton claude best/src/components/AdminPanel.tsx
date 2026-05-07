import { useState } from 'react';
import { useStore } from '../store/useStore';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

export function AdminPanel() {
  const { bets, currentUser, approveBet, rejectBet, resolveBet } = useStore();
  const [activeSection, setActiveSection] = useState<'pending' | 'active' | 'resolve'>('pending');
  const [resolveChoice, setResolveChoice] = useState<Record<string, 'yes' | 'no'>>({});

  if (!currentUser.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white/30">
        <div className="text-4xl mb-2">🔒</div>
        <div className="text-sm">Доступ только для администраторов</div>
      </div>
    );
  }

  const pendingBets = bets.filter((b) => b.status === 'pending');
  const activeBets = bets.filter((b) => b.status === 'active' && b.adminApproved);
  const resolvedBets = bets.filter((b) => b.status === 'resolved');
  const totalVolumeTON = bets.reduce((s, b) => s + b.totalVolume, 0);
  const totalFees = totalVolumeTON * 0.05;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 px-4 pt-4 pb-3">
        <h1 className="text-xl font-black text-white mb-1">🛡️ Панель администратора</h1>
        <div className="text-xs text-white/40 mb-3">Управление ставками и казной</div>

        {/* Treasury summary */}
        <div className="glass-card p-3 mb-3 border border-purple-500/20">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-sm font-bold text-[#0098EA]">{totalVolumeTON.toFixed(1)}</div>
              <div className="text-[10px] text-white/40">TON объём</div>
            </div>
            <div>
              <div className="text-sm font-bold text-yellow-400">{totalFees.toFixed(2)}</div>
              <div className="text-[10px] text-white/40">Комиссии</div>
            </div>
            <div>
              <div className="text-sm font-bold text-emerald-400">{activeBets.length}</div>
              <div className="text-[10px] text-white/40">Активных</div>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="flex gap-1 glass-card p-1 rounded-xl">
          {[
            { key: 'pending', label: `Ожидают (${pendingBets.length})` },
            { key: 'active', label: `Активные (${activeBets.length})` },
            { key: 'resolve', label: 'Завершить' },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key as typeof activeSection)}
              className={`flex-1 text-[10px] py-1.5 rounded-lg font-semibold transition-all ${activeSection === s.key ? 'bg-purple-500/30 text-purple-300' : 'text-white/40'}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scroll-content px-4 pb-4 space-y-3">
        {/* Pending bets */}
        {activeSection === 'pending' && (
          <>
            {pendingBets.length === 0 ? (
              <div className="glass-card p-6 text-center">
                <div className="text-3xl mb-2">✅</div>
                <div className="text-xs text-white/40">Нет ставок на модерации</div>
              </div>
            ) : (
              pendingBets.map((bet) => (
                <div key={bet.id} className="glass-card p-3 border border-yellow-500/20 animate-fadeIn">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="badge-pending text-[9px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">⏳ ОЖИДАНИЕ</span>
                    <h3 className="text-xs font-bold text-white leading-tight">{bet.title}</h3>
                  </div>
                  <p className="text-[10px] text-white/40 mb-2 line-clamp-2">{bet.description}</p>
                  <div className="flex gap-2 text-[10px] text-white/40 mb-3">
                    <span>{bet.category}</span>
                    <span>·</span>
                    <span>💎 {bet.totalVolume.toFixed(2)} TON</span>
                    <span>·</span>
                    <span>@{bet.creatorUsername}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-white/40 mb-3">
                    <span>Оракул: {bet.oracleType}</span>
                    {bet.oracleSymbol && <span>· {bet.oracleSymbol}</span>}
                    {bet.oracleTarget && <span>· ${bet.oracleTarget.toLocaleString()}</span>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => approveBet(bet.id)}
                      className="flex-1 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold"
                    >
                      ✅ Одобрить
                    </button>
                    <button
                      onClick={() => rejectBet(bet.id)}
                      className="flex-1 py-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold"
                    >
                      ❌ Отклонить
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* Active bets */}
        {activeSection === 'active' && (
          <>
            {activeBets.map((bet) => (
              <div key={bet.id} className="glass-card p-3 animate-fadeIn">
                <div className="flex items-start gap-2 mb-2">
                  <span className="badge-active text-[9px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">● LIVE</span>
                  <h3 className="text-xs font-bold text-white leading-tight">{bet.title}</h3>
                </div>
                <div className="flex gap-3 text-[10px] text-white/40 mb-2">
                  <span>💎 {bet.totalVolume.toFixed(2)} TON</span>
                  <span>· {bet.participants.length} уч.</span>
                  <span>· ДА {Math.round(bet.yesPrice * 100)}%</span>
                </div>
                <div className="text-[10px] text-white/30">
                  ⏱ {formatDistanceToNow(bet.resolveAt, { locale: ru, addSuffix: true })}
                </div>
              </div>
            ))}
            {activeBets.length === 0 && (
              <div className="glass-card p-6 text-center text-white/30 text-xs">Нет активных ставок</div>
            )}
          </>
        )}

        {/* Resolve bets */}
        {activeSection === 'resolve' && (
          <>
            {activeBets.map((bet) => (
              <div key={bet.id} className="glass-card p-3 border border-blue-500/20 animate-fadeIn">
                <h3 className="text-xs font-bold text-white mb-2 leading-tight">{bet.title}</h3>
                <div className="flex gap-2 text-[10px] text-white/40 mb-3">
                  <span>💎 {bet.totalVolume.toFixed(2)} TON в пуле</span>
                  <span>· {bet.participants.length} уч.</span>
                </div>
                <div className="text-[10px] text-white/40 mb-2">
                  {bet.oracleType === 'price' && `📊 Цена ${bet.oracleSymbol} ${bet.oracleDirection === 'above' ? '>' : '<'} $${bet.oracleTarget?.toLocaleString()}`}
                  {bet.oracleType === 'vote' && `🗳 Голоса: ДА ${bet.votes.filter(v => v.choice === 'yes').length} / НЕТ ${bet.votes.filter(v => v.choice === 'no').length}`}
                  {bet.oracleType === 'manual' && '👤 Ручное завершение'}
                </div>
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={() => setResolveChoice((prev) => ({ ...prev, [bet.id]: 'yes' }))}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${resolveChoice[bet.id] === 'yes' ? 'bg-emerald-500/40 text-emerald-300 border border-emerald-400' : 'btn-yes'}`}
                  >
                    ▲ ДА победило
                  </button>
                  <button
                    onClick={() => setResolveChoice((prev) => ({ ...prev, [bet.id]: 'no' }))}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${resolveChoice[bet.id] === 'no' ? 'bg-red-500/40 text-red-300 border border-red-400' : 'btn-no'}`}
                  >
                    ▼ НЕТ победило
                  </button>
                </div>
                {resolveChoice[bet.id] && (
                  <button
                    onClick={() => {
                      resolveBet(bet.id, resolveChoice[bet.id]);
                      setResolveChoice((prev) => { const n = { ...prev }; delete n[bet.id]; return n; });
                    }}
                    className="w-full py-2 rounded-xl btn-primary text-white font-black text-xs"
                  >
                    🏁 Завершить ставку → {resolveChoice[bet.id] === 'yes' ? 'ДА' : 'НЕТ'}
                  </button>
                )}
              </div>
            ))}
            {activeBets.length === 0 && (
              <div className="glass-card p-6 text-center text-white/30 text-xs">Нет ставок для завершения</div>
            )}
          </>
        )}

        {/* Stats */}
        <div className="glass-card p-3">
          <div className="text-xs font-bold text-white/60 mb-2">📈 Статистика</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { label: 'Всего ставок', value: bets.length },
              { label: 'Активных', value: activeBets.length },
              { label: 'На модерации', value: pendingBets.length },
              { label: 'Завершено', value: resolvedBets.length },
            ].map((s) => (
              <div key={s.label} className="flex justify-between">
                <span className="text-white/40">{s.label}:</span>
                <span className="text-white font-bold">{s.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-white/5">
            <div className="text-[10px] text-white/40">Кошелёк казны:</div>
            <div className="text-[10px] font-mono text-white/60 break-all">UQCfdyrb0Fj8lA32OfizTwGY829tTzihsEYl1FrpBzeVKdi0</div>
          </div>
        </div>
      </div>
    </div>
  );
}
